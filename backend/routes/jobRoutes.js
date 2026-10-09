const express = require('express');

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  closeJob
} = require('../controllers/jobController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);

router.post('/', protect, authorizeRoles('admin'), createJob);
router.put('/:id', protect, authorizeRoles('admin'), updateJob);
router.delete('/:id', protect, authorizeRoles('admin'), closeJob);

module.exports = router;