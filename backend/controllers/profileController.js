const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      branch,
      college,
      cgpa,
      graduationYear,
      backlogs,
      skills,
      projects,
      certifications
    } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (branch !== undefined) user.branch = branch;
    if (college !== undefined) user.college = college;
    if (cgpa !== undefined) user.cgpa = cgpa;
    if (graduationYear !== undefined) {
      user.graduationYear = graduationYear;
    }
    if (backlogs !== undefined) user.backlogs = backlogs;
    if (skills !== undefined) user.skills = skills;
    if (projects !== undefined) user.projects = projects;
    if (certifications !== undefined) {
      user.certifications = certifications;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        branch: updatedUser.branch,
        college: updatedUser.college,
        cgpa: updatedUser.cgpa,
        graduationYear: updatedUser.graduationYear,
        backlogs: updatedUser.backlogs,
        skills: updatedUser.skills,
        projects: updatedUser.projects,
        certifications: updatedUser.certifications
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};