const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const {
  checkEligibility
} = require('../services/eligibilityService');

const checkJobEligibility = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.'
      });
    }

    const student = await User.findById(
      req.user.userId
    ).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    const result = checkEligibility(student, job);

    const isOpen = job.status === 'open';
    const beforeDeadline =
      new Date(job.applicationDeadline) > new Date();

    const canApply =
      result.eligible && isOpen && beforeDeadline;

    const availabilityReasons = [];

    if (!isOpen) {
      availabilityReasons.push('This job is closed.');
    }

    if (!beforeDeadline) {
      availabilityReasons.push(
        'The application deadline has passed.'
      );
    }

    return res.status(200).json({
      success: true,
      eligible: result.eligible,
      canApply,
      reasons: result.reasons,
      missingSkills: result.missingSkills,
      availabilityReasons
    });
  } catch (error) {
    console.error('Eligibility check error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while checking eligibility.'
    });
  }
};

module.exports = { checkJobEligibility };