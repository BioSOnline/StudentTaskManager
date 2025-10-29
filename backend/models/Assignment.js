const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  assignmentType: {
    type: String,
    enum: ['individual', 'department', 'year'],
    required: true,
    default: 'individual'
  },
  // For individual assignments
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  // For department/year based assignments
  targetDepartment: {
    type: String,
    trim: true
  },
  targetYear: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference files from teacher
  referenceFiles: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'fs.files'
    }
  }],
  allowedFileTypes: [{
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip'],
    default: ['pdf', 'doc', 'docx']
  }],
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  submissionFormat: {
    type: String,
    enum: ['file', 'text', 'both'],
    default: 'file'
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
AssignmentSchema.index({ createdBy: 1, createdAt: -1 });
AssignmentSchema.index({ assignedTo: 1 });
AssignmentSchema.index({ targetDepartment: 1, targetYear: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
