const express = require('express');

const {
  applyForJob
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

module.exports = router;
