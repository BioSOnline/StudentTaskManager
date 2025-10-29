const mongoose = require('mongoose');

// Task Model - Simple notifications/reminders for students
// No file uploads, no submissions, just informational
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
    enum: ['reminder', 'homework', 'study', 'exam', 'event', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  taskType: {
    type: String,
    enum: ['individual', 'department', 'year'],
    required: true,
    default: 'individual'
  },
  // For individual tasks
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  // For department/year based tasks
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
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
TaskSchema.index({ createdBy: 1, createdAt: -1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ targetDepartment: 1, targetYear: 1 });

module.exports = mongoose.model('Task', TaskSchema);
