const mongoose = require('mongoose');
const Application = require('../models/Application');
const cloudinary = require('../config/cloudinary');

const downloadApplicantResume = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.',
      });
    }

    const application = await Application.findById(applicationId)
      .populate('student', 'resume');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    const resume = application.student?.resume;

    if (!resume?.publicId || !resume?.format) {
      return res.status(404).json({
        success: false,
        message: 'This applicant has not uploaded a resume.',
      });
    }

    const downloadUrl = cloudinary.utils.private_download_url(
      resume.publicId,
      resume.format,
      {
        resource_type: 'raw',
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + 300,
        attachment: true,
      }
    );

    return res.status(200).json({
      success: true,
      downloadUrl,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error('Admin applicant resume download error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to generate applicant resume download link.',
    });
  }
};

module.exports = { downloadApplicantResume };
