const express = require('express');

const {
  applyForJob, getMyApplications, withdrawApplication
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
router.patch(
  '/:applicationId/withdraw',
  protect,
  authorizeRoles('student'),
  withdrawApplication
);

module.exports = router;
