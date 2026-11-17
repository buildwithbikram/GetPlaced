const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');


const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalCompanies,
      activeCompanies,
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      applicationStatusStats,
      studentsWithApplications,
      studentsWithShortlistedApplications,
      recentApplications
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),

      Company.countDocuments(),

      Company.countDocuments({ isActive: true }),

      Job.countDocuments(),

      Job.countDocuments({ status: 'open' }),

      Job.countDocuments({ status: 'closed' }),

      Application.countDocuments(),

      Application.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      Application.distinct('student'),

      Application.distinct('student', {
        status: 'shortlisted'
      }),

      Application.find()
        .populate('student', 'name email branch')
        .populate({
          path: 'job',
          select: 'title company',
          populate: {
            path: 'company',
            select: 'name'
          }
        })
        .sort({ appliedAt: -1 })
        .limit(5)
        .lean()
    ]);


    const applicationCounts = {
      applied: 0,
      'under-review': 0,
      shortlisted: 0,
      rejected: 0,
      withdrawn: 0
    };

    applicationStatusStats.forEach(item => {
      applicationCounts[item._id] = item.count;
    });

    const studentsWithAtLeastOneApplication =
      studentsWithApplications.length;

    const studentsWithAtLeastOneShortlist =
      studentsWithShortlistedApplications.length;

    return res.status(200).json({
      success: true,
      dashboard: {
        students: {
          total: totalStudents,
          withApplications: studentsWithAtLeastOneApplication,
          withoutApplications:
            totalStudents - studentsWithAtLeastOneApplication,
          participationPercentage:
            totalStudents > 0
              ? Number(
                  (
                    (studentsWithAtLeastOneApplication / totalStudents) *
                    100
                  ).toFixed(2)
                )
              : 0
        },

        companies: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: totalCompanies - activeCompanies
        },

        jobs: {
          total: totalJobs,
          open: openJobs,
          closed: closedJobs
        },

        applications: {
          total: totalApplications,
          byStatus: applicationCounts
        },

        placement: {
          studentsWithAtLeastOneShortlist:
            studentsWithAtLeastOneShortlist,
          shortlistedApplicationCount:
            applicationCounts.shortlisted,
          note:
            'Shortlisting is not confirmed placement. Placement statistics will be available after offer and selection tracking is implemented.'
        },

        recentApplications
      }
    });

  } catch (error) {
    console.error('Admin dashboard stats error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics.'
    });
  }
};

module.exports = {
  getDashboardStats
};