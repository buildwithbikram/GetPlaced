const express = require('express');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const uploadResumeFile = require('../middleware/resumeUploadMiddleware');

const {
  getResume,
  uploadResume,
  downloadResume,
  deleteResume,
} = require('../controllers/resumeController');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('student'));

router.get('/', getResume);

router.post('/', uploadResumeFile, uploadResume);

router.get('/download', downloadResume);

router.delete('/', deleteResume);

module.exports = router;
