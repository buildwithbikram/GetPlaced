const express = require('express');

const {
  checkJobEligibility
} = require('../controllers/eligibilityController');

const { protect } = require('../middleware/authMiddleware');
const {
  authorizeRoles
} = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/:id/eligibility',
  protect,
  authorizeRoles('student'),
  checkJobEligibility
);

module.exports = router;