const Company = require('../models/Company');

const createCompany = async (req, res) => {
  try {
    const { name, description, website, industry, location } = req.body;

    if (!name || !name.trim()) {
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

const getCompanyById = async (req, res) => {
  try {
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
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    console.error('Get company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById
};