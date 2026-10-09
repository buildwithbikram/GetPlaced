const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    location: {
      type: String,
      trim: true,
      default: 'Not specified'
    },

    jobType: {
      type: String,
      enum: ['internship', 'full-time', 'part-time'],
      required: true
    },

    packageLPA: {
      type: Number,
      min: 0,
      default: null
    },

    minimumCgpa: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },

    maximumBacklogs: {
      type: Number,
      min: 0,
      default: 0
    },

    eligibleBranches: {
      type: [String],
      default: []
    },

    eligibleGraduationYears: {
      type: [Number],
      default: []
    },

    requiredSkills: {
      type: [String],
      default: []
    },

    applicationDeadline: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);