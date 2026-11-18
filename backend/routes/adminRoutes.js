
const express = require('express');

const {
  getDashboardStats
} = require('../controllers/adminDashboardController');

const {
  getAllStudents,
  getStudentById
} = require('../controllers/adminStudentController');

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

// View and search all students
router.get(
  '/students',
  protect,
  authorizeRoles('admin'),
  getAllStudents
);

// View individual student profile
router.get(
  '/students/:studentId',
  protect,
  authorizeRoles('admin'),
  getStudentById
);

module.exports = router;
