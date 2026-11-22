const path = require('path');
const AdmZip = require('adm-zip');

const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const allowedExtensions = ['.pdf', '.doc', '.docx'];

const getFileFormat = (filename) =>
  path.extname(filename).toLowerCase().slice(1);

const validateFileSignature = (file, extension) => {
  const buffer = file.buffer;

  // PDF signature: %PDF-
  if (extension === 'pdf') {
    return buffer.subarray(0, 5).toString() === '%PDF-';
  }

  // Legacy Microsoft Word DOC signature: OLE compound document
  if (extension === 'doc') {
    const signature = Buffer.from([
      0xd0, 0xcf, 0x11, 0xe0,
      0xa1, 0xb1, 0x1a, 0xe1,
    ]);

    return buffer.subarray(0, 8).equals(signature);
  }

  // DOCX is a ZIP archive containing Word document XML.
  if (extension === 'docx') {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const hasDocument = entries.some(
        (entry) => entry.entryName === 'word/document.xml'
      );

      const hasContentTypes = entries.some(
        (entry) => entry.entryName === '[Content_Types].xml'
      );

      return hasDocument && hasContentTypes;
    } catch {
      return false;
    }
  }

  return false;
};

const uploadToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
        public_id: publicId,
        asset_folder: 'getplaced/resumes',
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

// GET /api/resume
const getResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('resume');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      resume: user.resume?.publicId
        ? {
            originalName: user.resume.originalName,
            format: user.resume.format,
            size: user.resume.size,
            uploadedAt: user.resume.uploadedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Get resume error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve resume information.',
    });
  }
};

// POST /api/resume
const uploadResume = async (req, res) => {
  let uploadedAsset = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a resume file.',
      });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF, DOC and DOCX files are allowed.',
      });
    }

    const format = getFileFormat(req.file.originalname);

    if (!validateFileSignature(req.file, format)) {
      return res.status(400).json({
        success: false,
        message: 'The file contents do not match the selected document format.',
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const safeName = path
      .basename(req.file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    // Raw Cloudinary public IDs must include the file extension.
    const publicId =
      `getplaced/resumes/${user._id}_${Date.now()}_${safeName}${extension}`;

    uploadedAsset = await uploadToCloudinary(
      req.file.buffer,
      publicId
    );

    const oldPublicId = user.resume?.publicId;

    user.resume = {
      publicId: uploadedAsset.public_id,
      originalName: req.file.originalname,
      format,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    try {
      await user.save();
    } catch (databaseError) {
      // Roll back the new Cloudinary upload if MongoDB save fails.
      await cloudinary.uploader.destroy(
        uploadedAsset.public_id,
        {
          resource_type: 'raw',
          type: 'authenticated',
        }
      );

      uploadedAsset = null;
      throw databaseError;
    }

    // Delete the previous resume only after the replacement is saved.
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: 'raw',
          type: 'authenticated',
        });
      } catch (deleteError) {
        console.error(
          'Old resume cleanup failed:',
          deleteError.message
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume: {
        originalName: user.resume.originalName,
        format: user.resume.format,
        size: user.resume.size,
        uploadedAt: user.resume.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to upload resume. Please try again.',
    });
  }
};

// GET /api/resume/download
const downloadResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('resume');

    if (!user || !user.resume?.publicId) {
      return res.status(404).json({
        success: false,
        message: 'No resume has been uploaded.',
      });
    }

    // Generate a signed download URL valid for five minutes.
    const downloadUrl = cloudinary.utils.private_download_url(
      user.resume.publicId,
      user.resume.format,
      {
        resource_type: 'raw',
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + 300,
        attachment: true,
      }
    );

    res.status(200).json({
      success: true,
      downloadUrl,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error('Resume download error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to generate resume download link.',
    });
  }
};

// DELETE /api/resume
const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.resume?.publicId) {
      return res.status(404).json({
        success: false,
        message: 'No resume found to delete.',
      });
    }

    const publicId = user.resume.publicId;

    user.resume = {
      publicId: null,
      originalName: null,
      format: null,
      size: null,
      uploadedAt: null,
    };

    await user.save();

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
        type: 'authenticated',
      });
    } catch (deleteError) {
      console.error(
        'Cloudinary resume deletion failed:',
        deleteError.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Resume record was cleared, but cloud cleanup failed. Please contact support.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    console.error('Resume deletion error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to delete resume.',
    });
  }
};

module.exports = {
  getResume,
  uploadResume,
  downloadResume,
  deleteResume,
};
