const express = require('express');

const {
  createCompany,
  getCompanies,
  getCompanyById
} = require('../controllers/companyController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getCompanies);
router.get('/:id', getCompanyById);

router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  createCompany
);

module.exports = router;