const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['student', 'admin', 'recruiter'],
      default: 'student'
    },
 
    phone: {
      type: String,
      trim: true
    },

    branch: {
      type: String,
      trim: true
    },

    college: {
      type: String,
      trim: true
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10
    },

    graduationYear: {
      type: Number
    },

    backlogs: {
      type: Number,
      min: 0,
      default: 0
    },

    skills: {
      type: [String],
      default: []
    },

    projects: {
      type: [String],
      default: []
    },

    certifications: {
      type: [String],
      default: []
    },

    resume: {
      publicId: {
        type: String,
        default: null
      },
      originalName: {
        type: String,
        default: null
      },
      format: {
        type: String,
        enum: ['pdf', 'doc', 'docx', null],
        default: null
      },
      size: {
        type: Number,
        default: null
      },
      uploadedAt: {
        type: Date,
        default: null
      }
    }

  },
  
  {
    timestamps: true
  }

);

const User = mongoose.model('User', userSchema);

module.exports = User;