
const mongoose = require('mongoose');

const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');

const {
  checkEligibility
} = require('../services/eligibilityService');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Student only

const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.'
      });
    }

    const student = await User.findOne({
      _id: req.user.userId,
      role: 'student'
    }).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.'
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is currently closed.'
      });
    }

    if (new Date(job.applicationDeadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline has passed.'
      });
    }

    const existingApplication = await Application.findOne({
      student: student._id,
      job: job._id
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job.',
        applicationId: existingApplication._id
      });
    }

    const eligibility = checkEligibility(student, job);

    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible for this job.',
        reasons: eligibility.reasons,
        missingSkills: eligibility.missingSkills
      });
    }

    const application = await Application.create({
      student: student._id,
      job: job._id,
      status: 'applied',
      statusHistory: [
        {
          status: 'applied',
          changedBy: student._id,
          note: 'Application submitted successfully.'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Job application submitted successfully.',
      application
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job.'
      });
    }

    console.error('Apply for job error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while submitting application.'
    });
  }
};

module.exports = {
  applyForJob
};
