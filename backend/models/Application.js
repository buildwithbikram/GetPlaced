const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'applied',
        'under-review',
        'shortlisted',
        'rejected',
        'withdrawn'
      ],
      required: true
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    note: {
      type: String,
      trim: true,
      default: ''
    },

    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },

    status: {
      type: String,
      enum: [
        'applied',
        'under-review',
        'shortlisted',
        'rejected',
        'withdrawn'
      ],
      default: 'applied'
    },

    appliedAt: {
      type: Date,
      default: Date.now
    },

    withdrawnAt: {
      type: Date,
      default: null
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

applicationSchema.index(
  { student: 1, job: 1 },
  { unique: true }
);

const Application = mongoose.model(
  'Application',
  applicationSchema
);

module.exports = Application;
