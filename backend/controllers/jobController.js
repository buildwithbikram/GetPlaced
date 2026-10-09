const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');

const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      company,
      location,
      jobType,
      packageLPA,
      minimumCgpa,
      maximumBacklogs,
      eligibleBranches,
      eligibleGraduationYears,
      requiredSkills,
      applicationDeadline
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !company ||
      !jobType ||
      minimumCgpa === undefined ||
      !applicationDeadline
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required job fields'
      });
    }

    if (!mongoose.isValidObjectId(company)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const companyExists = await Company.findOne({
      _id: company,
      isActive: true
    });

    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: 'Active company not found'
      });
    }

    const deadline = new Date(applicationDeadline);

    if (Number.isNaN(deadline.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application deadline'
      });
    }

    if (deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline must be in the future'
      });
    }

    if (
      !Number.isFinite(minimumCgpa) ||
      minimumCgpa < 0 ||
      minimumCgpa > 10
    ) {
      return res.status(400).json({
        success: false,
        message: 'Minimum CGPA must be between 0 and 10'
      });
    }

    if (
      packageLPA !== undefined &&
      packageLPA !== null &&
      (!Number.isFinite(packageLPA) || packageLPA < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Package must be a non-negative number'
      });
    }

    if (
      maximumBacklogs !== undefined &&
      (!Number.isInteger(maximumBacklogs) || maximumBacklogs < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Maximum backlogs must be a non-negative integer'
      });
    }

    const arrayFields = [
      ['eligibleBranches', eligibleBranches],
      ['eligibleGraduationYears', eligibleGraduationYears],
      ['requiredSkills', requiredSkills]
    ];

    for (const [field, value] of arrayFields) {
      if (value !== undefined && !Array.isArray(value)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an array`
        });
      }
    }

    if (
      eligibleGraduationYears?.some(
        year => !Number.isInteger(year) || year < 2000 || year > 2100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Graduation years must be valid years'
      });
    }

    const job = await Job.create({
      title,
      description,
      company,
      location,
      jobType,
      packageLPA,
      minimumCgpa,
      maximumBacklogs,
      eligibleBranches,
      eligibleGraduationYears,
      requiredSkills,
      applicationDeadline: deadline,
      createdBy: req.user.userId
    });

    const populatedJob = await Job.findById(job._id)
      .populate('company', 'name location website');

    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: populatedJob
    });
  } catch (error) {
    console.error('Create job error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job data',
        errors: Object.values(error.errors).map(item => item.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const now = new Date();

    const jobs = await Job.find({
      status: 'open',
      applicationDeadline: { $gt: now }
    })
      .populate('company', 'name location website')
      .select('-__v')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getJobById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      status: 'open',
      applicationDeadline: { $gt: new Date() }
    })
      .populate('company', 'name location website')
      .select('-__v');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Open job not found'
      });
    }

    return res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Get job error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    const allowedFields = [
      'title',
      'description',
      'company',
      'location',
      'jobType',
      'packageLPA',
      'minimumCgpa',
      'maximumBacklogs',
      'eligibleBranches',
      'eligibleGraduationYears',
      'requiredSkills',
      'applicationDeadline',
      'status'
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update'
      });
    }

    if (updates.company !== undefined) {
      if (!mongoose.isValidObjectId(updates.company)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID'
        });
      }

      const companyExists = await Company.findOne({
        _id: updates.company,
        isActive: true
      });

      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: 'Active company not found'
        });
      }
    }

    if (updates.applicationDeadline !== undefined) {
      const deadline = new Date(updates.applicationDeadline);

      if (Number.isNaN(deadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid application deadline'
        });
      }

      updates.applicationDeadline = deadline;
    }

    if (
      updates.minimumCgpa !== undefined &&
      (!Number.isFinite(updates.minimumCgpa) ||
        updates.minimumCgpa < 0 ||
        updates.minimumCgpa > 10)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Minimum CGPA must be between 0 and 10'
      });
    }

    if (
      updates.packageLPA !== undefined &&
      updates.packageLPA !== null &&
      (!Number.isFinite(updates.packageLPA) || updates.packageLPA < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Package must be a non-negative number'
      });
    }

    if (
      updates.maximumBacklogs !== undefined &&
      (!Number.isInteger(updates.maximumBacklogs) ||
        updates.maximumBacklogs < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Maximum backlogs must be a non-negative integer'
      });
    }

    if (
      updates.status !== undefined &&
      !['open', 'closed'].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job status'
      });
    }

    for (const field of [
      'eligibleBranches',
      'eligibleGraduationYears',
      'requiredSkills'
    ]) {
      if (updates[field] !== undefined && !Array.isArray(updates[field])) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an array`
        });
      }
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    ).populate('company', 'name location website');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job data'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const closeJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'closed' } },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job closed successfully',
      job
    });
  } catch (error) {
    console.error('Close job error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  closeJob
};