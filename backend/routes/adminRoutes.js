
const express = require('express');

const {
  getDashboardStats
} = require('../controllers/adminDashboardController');

const { protect } = require('../middleware/authMiddleware');

const {
  authorizeRoles
} = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/dashboard',
  protect,
  authorizeRoles('admin'),
  getDashboardStats
);

module.exports = router;
