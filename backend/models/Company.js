const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    website: {
      type: String,
      trim: true,
      default: ''
    },

    industry: {
      type: String,
      trim: true,
      default: ''
    },

    location: {
      type: String,
      trim: true,
      default: ''
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);