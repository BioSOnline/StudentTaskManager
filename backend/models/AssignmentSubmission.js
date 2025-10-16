const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    contentType: {
      type: String,
      default: 'application/octet-stream'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  submissionText: {
    type: String,
    trim: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'graded', 'returned'],
    default: 'submitted'
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    trim: true
  },
  teacherComments: {
    type: String,
    trim: true
  },
  teacherNotified: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
AssignmentSubmissionSchema.index({ taskId: 1, studentId: 1 });
AssignmentSubmissionSchema.index({ studentId: 1, submissionDate: -1 });
AssignmentSubmissionSchema.index({ status: 1 });

// Update lastModified on save
AssignmentSubmissionSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual for submission age
AssignmentSubmissionSchema.virtual('submissionAge').get(function() {
  return Math.floor((Date.now() - this.submissionDate) / (1000 * 60 * 60 * 24)); // Days since submission
});

// Method to check if submission is late
AssignmentSubmissionSchema.methods.isLate = async function() {
  try {
    const Task = mongoose.model('Task');
    const task = await Task.findById(this.taskId);
    if (!task || !task.dueDate) return false;
    return this.submissionDate > task.dueDate;
  } catch (error) {
    return false;
  }
};

// Static method to get submissions by task
AssignmentSubmissionSchema.statics.getSubmissionsByTask = function(taskId) {
  return this.find({ taskId })
    .populate('studentId', 'name email studentId')
    .populate('taskId', 'title dueDate category priority')
    .sort({ submissionDate: -1 });
};

// Static method to get student's submissions
AssignmentSubmissionSchema.statics.getStudentSubmissions = function(studentId) {
  return this.find({ studentId })
    .populate('taskId', 'title dueDate category priority')
    .sort({ submissionDate: -1 });
};

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);