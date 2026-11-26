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



const getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.'
      });
    }

    const job = await Job.findById(jobId).populate(
      'company',
      'name industry location'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const allowedStatuses = [
      'applied',
      'under-review',
      'shortlisted',
      'rejected',
      'withdrawn'
    ];


    const filter = { job: jobId };

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid application status filter.'
        });
      }

      filter.status = req.query.status;
    }

    const [applications, totalApplications] = await Promise.all([
      Application.find(filter)
        .populate(
          'student',
          'name email phone branch college cgpa graduationYear backlogs skills projects certifications'
        )
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Application.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      job,
      count: applications.length,
      totalApplications,
      currentPage: page,
      totalPages: Math.ceil(totalApplications / limit),
      applications
    });

  } catch (error) {
    console.error('Get applicants for job error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching job applicants.'
    });
  }
};



const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.'
      });
    }

    const application = await Application.findById(applicationId)
      .populate(
        'student',
        'name email phone branch college cgpa graduationYear backlogs skills projects certifications resume.originalName resume.format resume.size resume.uploadedAt'
      )
      .populate({
        path: 'job',
        select: 'title description location jobType packageLPA minimumCgpa applicationDeadline status company',
        populate: {
          path: 'company',
          select: 'name industry location website'
        }
      })
      .populate(
        'statusHistory.changedBy',
        'name email role'
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    return res.status(200).json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Get application details error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching application details.'
    });
  }
};



const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, note } = req.body;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.'
      });
    }

    const allowedTransitions = {
      applied: ['under-review', 'rejected'],
      'under-review': ['shortlisted', 'rejected'],
      shortlisted: ['rejected'],
      rejected: [],
      withdrawn: []
    };

    const allowedStatuses = Object.keys(allowedTransitions);

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status.'
      });
    }

    if (
      note !== undefined &&
      (typeof note !== 'string' || note.trim().length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Note must be a string of at most 500 characters.'
      });
    }

    const existingApplication = await Application.findById(
      applicationId
    );

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    const currentStatus = existingApplication.status;

    const permittedNextStatuses =
      allowedTransitions[currentStatus] || [];

    if (!permittedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change application status from ${currentStatus} to ${status}.`
      });
    }

    const updatedApplication = await Application.findOneAndUpdate(
      {
        _id: applicationId,
        status: currentStatus
      },
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            changedBy: req.user.userId,
            note: note?.trim() || `Status changed to ${status}.`,
            changedAt: new Date()
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('student', 'name email branch cgpa')
      .populate({
        path: 'job',
        select: 'title company',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate('statusHistory.changedBy', 'name email role');

    if (!updatedApplication) {
      return res.status(409).json({
        success: false,
        message: 'Application status changed by another request. Please refresh and try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}.`,
      application: updatedApplication
    });

  } catch (error) {
    console.error('Update application status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while updating application status.'
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  withdrawApplication,
  getApplicantsForJob,
  getApplicationById,
  updateApplicationStatus
};
