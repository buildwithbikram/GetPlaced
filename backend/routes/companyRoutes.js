const express = require('express');

const {
  createCompany,
  getCompanies,
  getCompanyById,
  getAllCompaniesForAdmin,
  updateCompany,
  updateCompanyStatus
} = require('../controllers/companyController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getCompanies);
router.get('/:id', getCompanyById);

// Admin-only routes
router.get(
  '/admin/all',
  protect,
  authorizeRoles('admin'),
  getAllCompaniesForAdmin
);

router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  createCompany
);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin'),
  updateCompany
);

router.patch(
  '/:id/status',
  protect,
  authorizeRoles('admin'),
  updateCompanyStatus
);

module.exports = router;