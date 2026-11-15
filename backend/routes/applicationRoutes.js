const express = require('express');

const {
  applyForJob,
  getMyApplications, 
  withdrawApplication,
  getApplicantsForJob,
  getApplicationById,
  updateApplicationStatus
} = require('../controllers/applicationController');

const { protect } = require('../middleware/authMiddleware');

const {
  authorizeRoles
} = require('../middleware/roleMiddleware');

const router = express.Router();

//Student routes
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
router.patch(
  '/:applicationId/withdraw',
  protect,
  authorizeRoles('student'),
  withdrawApplication
);

//Admin routes
router.get(
  '/admin/jobs/:jobId/applicants',
  protect,
  authorizeRoles('admin'),
  getApplicantsForJob
);
router.get(
  '/admin/:applicationId',
  protect,
  authorizeRoles('admin'),
  getApplicationById
);
router.patch(
  '/admin/:applicationId/status',
  protect,
  authorizeRoles('admin'),
  updateApplicationStatus
);

module.exports = router;
