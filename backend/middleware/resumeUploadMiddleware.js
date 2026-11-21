const multer = require('multer');
const path = require('path');

const allowedTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMime = allowedTypes[extension];

    if (!expectedMime || file.mimetype !== expectedMime) {
      return callback(
        new Error('Only PDF, DOC and DOCX files are allowed.')
      );
    }

    callback(null, true);
  },
});

const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Resume must not exceed 5 MB.',
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid resume upload.',
      });
    }

    next();
  });
};

module.exports = uploadResume;
