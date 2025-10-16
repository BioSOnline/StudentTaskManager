const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['homework', 'project', 'exam', 'assignment', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
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
  instructions: {
    type: String,
    trim: true
  },
  allowedFileTypes: [{
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);