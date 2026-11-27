const express = require('express');

const {
  createJob,
  getJobs,
  getAllJobsForAdmin,
  getJobById,
  updateJob,
  updateJobStatus
} = require('../controllers/jobController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Admin-only routes
router.get(
  '/admin/all',
  protect,
  authorizeRoles('admin'),
  getAllJobsForAdmin
);
router.post('/', protect, authorizeRoles('admin'), createJob);
router.put('/:id', protect, authorizeRoles('admin'), updateJob);
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('admin'),
  updateJobStatus
);

module.exports = router;