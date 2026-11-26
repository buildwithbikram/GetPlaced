const mongoose = require('mongoose');
const Company = require('../models/Company');

// Create company (Admin)
const createCompany = async (req, res) => {
  try {
    const { name, description, website, industry, location } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const company = await Company.create({
      name: name.trim(),
      description,
      website,
      industry,
      location,
      createdBy: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    console.error('Create company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get active companies (Existing public API)
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    console.error('Get companies error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get one active company (Existing public API)
const getCompanyById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const company = await Company.findOne({
      _id: req.params.id,
      isActive: true
    }).select('-__v');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    return res.status(200).json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Get company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all companies for Admin (Active + Inactive)
const getAllCompaniesForAdmin = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      page = 1,
      limit = 10
    } = req.query;

    if (!['all', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company status filter.'
      });
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(
      50,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const filter = {};

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { industry: { $regex: escapedSearch, $options: 'i' } },
        { location: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const totalCompanies = await Company.countDocuments(filter);

    const companies = await Company.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    return res.status(200).json({
      success: true,
      count: companies.length,
      totalCompanies,
      currentPage,
      totalPages: Math.ceil(totalCompanies / pageLimit),
      companies
    });
  } catch (error) {
    console.error('Admin get companies error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch companies.'
    });
  }
};

// Update company details (Admin)
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'name',
      'description',
      'website',
      'industry',
      'location'
    ];

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.'
      });
    }

    const updates = {};
    const suppliedFields = Object.keys(req.body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update.'
      });
    }

    for (const field of suppliedFields) {
      if (!allowedFields.includes(field)) {
        return res.status(400).json({
          success: false,
          message: `Updating ${field} is not allowed.`
        });
      }

      if (typeof req.body[field] !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`
        });
      }

      updates[field] = req.body[field].trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'name') &&
      !updates.name
    ) {
      return res.status(400).json({
        success: false,
        message: 'Company name cannot be empty.'
      });
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    ).select('-__v');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully.',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update company.'
    });
  }
};

// Activate / Deactivate company (Admin)
const updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value.'
      });
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      {
        new: true,
        runValidators: true
      }
    ).select('-__v');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully.`,
      company
    });
  } catch (error) {
    console.error('Update company status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update company status.'
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  getAllCompaniesForAdmin,
  updateCompany,
  updateCompanyStatus
};