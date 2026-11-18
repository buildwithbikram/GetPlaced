const mongoose = require('mongoose');
const User = require('../models/User');

// Escape special regex characters in user input
const escapeRegex = value => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Get all students with search, filters and pagination
// @route   GET /api/admin/students
// @access  Admin only

const getAllStudents = async (req, res) => {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
      role: 'student'
    };

    // Search by name, email, branch or college
    if (req.query.search) {
      const search = String(req.query.search).trim();

      if (search.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Search query cannot exceed 100 characters.'
        });
      }

      if (search) {
        const searchRegex = new RegExp(
          escapeRegex(search),
          'i'
        );

        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { branch: searchRegex },
          { college: searchRegex }
        ];
      }
    }

    // Filter by branch
    if (req.query.branch) {
      const branch = String(req.query.branch).trim();

      if (branch.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Branch filter is too long.'
        });
      }

      filter.branch = new RegExp(
        `^${escapeRegex(branch)}$`,
        'i'
      );
    }

    // Filter by graduation year
    if (req.query.graduationYear !== undefined) {
      const graduationYear = Number(req.query.graduationYear);

      if (
        !Number.isInteger(graduationYear) ||
        graduationYear < 2000 ||
        graduationYear > 2100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid graduation year.'
        });
      }

      filter.graduationYear = graduationYear;
    }

    const [students, totalStudents] = await Promise.all([
      User.find(filter)
        .select(
          'name email phone branch college cgpa graduationYear backlogs skills createdAt'
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: students.length,
      totalStudents,
      currentPage: page,
      totalPages: Math.ceil(totalStudents / limit),
      students
    });

  } catch (error) {
    console.error('Get all students error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching students.'
    });
  }
};


// @desc    Get an individual student's complete profile
// @route   GET /api/admin/students/:studentId
// @access  Admin only

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID.'
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: 'student'
    })
      .select('-password')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    return res.status(200).json({
      success: true,
      student
    });

  } catch (error) {
    console.error('Get student details error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching student details.'
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById
};
