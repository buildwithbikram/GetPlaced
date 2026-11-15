const express = require('express');

const {
  applyForJob, getMyApplications
} = require('../controllers/applicationController');

const { protect } = require('../middleware/authMiddleware');

const {
  authorizeRoles
} = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/:jobId',
  protect,
  authorizeRoles('student'),
  applyForJob
);
router.get(
  '/my-applications',
  protect,
  authorizeRoles('student'),
  getMyApplications
);

module.exports = router;
