const mongoose = require('mongoose');

const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');

const {
  checkEligibility
} = require('../services/eligibilityService');


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


const getMyApplications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const [applications, totalApplications] = await Promise.all([
      Application.find({
        student: req.user.userId
      })
        .populate({
          path: 'job',
          select: 'title location jobType packageLPA applicationDeadline status company',
          populate: {
            path: 'company',
            select: 'name industry location'
          }
        })
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Application.countDocuments({
        student: req.user.userId
      })
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      totalApplications,
      currentPage: page,
      totalPages: Math.ceil(totalApplications / limit),
      applications
    });

  } catch (error) {
    console.error('Get my applications error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching applications.'
    });
  }
};


const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.'
      });
    }

    const application = await Application.findOneAndUpdate(
      {
        _id: applicationId,
        student: req.user.userId,
        status: { $in: ['applied', 'under-review'] }
      },
      {
        $set: {
          status: 'withdrawn',
          withdrawnAt: new Date()
        },
        $push: {
          statusHistory: {
            status: 'withdrawn',
            changedBy: req.user.userId,
            note: 'Application withdrawn by student.'
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'job',
      select: 'title company',
      populate: {
        path: 'company',
        select: 'name'
      }
    });

    if (!application) {
      const existingApplication = await Application.findOne({
        _id: applicationId,
        student: req.user.userId
      });

      if (!existingApplication) {
        return res.status(404).json({
          success: false,
          message: 'Application not found.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `You cannot withdraw an application with status: ${existingApplication.status}.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
      application
    });

  } catch (error) {
    console.error('Withdraw application error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while withdrawing application.'
    });
  }
};

module.exports = {
  applyForJob, getMyApplications, withdrawApplication
};
