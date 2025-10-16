const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Task = require('../models/Task');
const Student = require('../models/Student');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload, uploadToGridFS, downloadFromGridFS, deleteFromGridFS } = require('../middleware/upload');

const router = express.Router();

// Email transporter configuration
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email notifications will be disabled.');
    return null;
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Submit assignment with file upload
router.post('/submit', [
  auth,
  upload.array('files', 5),
  body('taskId').isMongoId().withMessage('Valid task ID is required'),
  body('submissionText').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId, submissionText } = req.body;
    const studentId = req.userId;

    // Verify task exists and get task details with student info
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name studentId email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if this student is assigned to this task
    if (task.assignedTo._id.toString() !== studentId) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    // Check if files are provided
    if (!req.files || req.files.length === 0) {
      if (!submissionText || submissionText.trim() === '') {
        return res.status(400).json({ message: 'Please upload at least one file or provide submission text' });
      }
    }

    // Upload files to GridFS
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadToGridFS(file, {
            taskId: taskId,
            studentId: studentId,
            originalName: file.originalname,
            contentType: file.mimetype,
            uploadDate: new Date()
          });

          uploadedFiles.push({
            fileId: uploadResult.id,
            filename: uploadResult.filename,
            originalName: file.originalname,
            fileSize: file.size,
            contentType: file.mimetype,
            uploadDate: new Date()
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return res.status(500).json({ message: `Failed to upload file: ${file.originalname}` });
        }
      }
    }

    // Check if submission already exists
    let submission = await AssignmentSubmission.findOne({ taskId, studentId });

    if (submission) {
      // Update existing submission
      submission.files.push(...uploadedFiles);
      if (submissionText) {
        submission.submissionText = submissionText;
      }
      submission.submissionDate = new Date();
      submission.status = 'submitted';
      submission.teacherNotified = false;
      await submission.save();
    } else {
      // Create new submission
      submission = new AssignmentSubmission({
        taskId,
        studentId,
        files: uploadedFiles,
        submissionText: submissionText || '',
        submissionDate: new Date(),
        status: 'submitted'
      });
      await submission.save();
    }

    // Send email notification to teacher
    const transporter = createTransporter();
    if (transporter && task.createdBy.email) {
      try {
        const isLate = await submission.isLate();
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: task.createdBy.email,
          subject: `${isLate ? '[LATE] ' : ''}New Assignment Submission: ${task.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                Assignment Submission ${isLate ? '(LATE)' : ''}
              </h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #007bff;">Task Details</h3>
                <p><strong>Title:</strong> ${task.title}</p>
                <p><strong>Category:</strong> ${task.category}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
              </div>

              <div style="background-color: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #28a745;">Student Information</h3>
                <p><strong>Name:</strong> ${task.assignedTo.name}</p>
                <p><strong>Student ID:</strong> ${task.assignedTo.studentId}</p>
                <p><strong>Email:</strong> ${task.assignedTo.email}</p>
              </div>

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404;">Submission Details</h3>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Files Uploaded:</strong> ${uploadedFiles.length}</p>
                ${uploadedFiles.length > 0 ? `
                  <ul>
                    ${uploadedFiles.map(file => `<li>${file.originalName} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB)</li>`).join('')}
                  </ul>
                ` : ''}
                ${submissionText ? `
                  <div style="margin-top: 15px;">
                    <strong>Submission Notes:</strong>
                    <div style="background-color: white; padding: 10px; border-left: 4px solid #007bff; margin-top: 5px;">
                      ${submissionText.replace(/\n/g, '<br>')}
                    </div>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/assignments/${submission._id}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Submission Details
                </a>
              </div>

              <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; font-size: 12px;">
                <p>This email was sent automatically by the Student Task Manager system.</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        submission.teacherNotified = true;
        await submission.save();
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the submission if email fails
      }
    }

    // Populate submission data for response
    await submission.populate('taskId', 'title dueDate category priority');
    await submission.populate('studentId', 'name email');

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission: submission,
      isLate: await submission.isLate()
    });

  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
});

// Get student's submissions
router.get('/my-submissions', auth, async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.getStudentSubmissions(req.userId);
    res.json(submissions);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// Get all submissions (for teachers/admins)
router.get('/all', auth, async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find()
      .populate('taskId', 'title description dueDate category priority')
      .populate('studentId', 'name email studentId')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Fetch all submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// Get submission details
router.get('/submission/:id', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.id)
      .populate('taskId', 'title description dueDate category priority createdBy')
      .populate('studentId', 'name email studentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check access rights
    const isStudent = submission.studentId._id.toString() === req.userId;
    const isTeacher = submission.taskId.createdBy.toString() === req.userId;

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      submission,
      isLate: await submission.isLate()
    });
  } catch (error) {
    console.error('Fetch submission error:', error);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

// Download file
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Find submission containing this file
    const submission = await AssignmentSubmission.findOne({
      'files.fileId': mongoose.Types.ObjectId(fileId)
    }).populate('taskId', 'createdBy').populate('studentId', '_id');

    if (!submission) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check access rights
    const isStudent = submission.studentId._id.toString() === req.userId;
    const isTeacher = submission.taskId.createdBy.toString() === req.userId;

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get file from GridFS
    const { stream, file } = await downloadFromGridFS(fileId);
    const fileInfo = submission.files.find(f => f.fileId.toString() === fileId);

    // Set headers for download
    res.set({
      'Content-Type': fileInfo?.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileInfo?.originalName || file.filename}"`
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
});

// Get all submissions for a task (Teacher only)
router.get('/task/:taskId/submissions', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task || task.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submissions = await AssignmentSubmission.getSubmissionsByTask(req.params.taskId);
    
    // Add late status to each submission
    const submissionsWithStatus = await Promise.all(
      submissions.map(async (submission) => ({
        ...submission.toObject(),
        isLate: await submission.isLate()
      }))
    );

    res.json(submissionsWithStatus);
  } catch (error) {
    console.error('Fetch task submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch task submissions' });
  }
});

// Grade submission (Teacher only)
router.put('/grade/:id', [
  auth,
  body('grade').isFloat({ min: 0, max: 100 }).withMessage('Grade must be between 0 and 100'),
  body('feedback').optional().trim(),
  body('teacherComments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const submission = await AssignmentSubmission.findById(req.params.id)
      .populate('taskId', 'createdBy title')
      .populate('studentId', 'name email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user is the teacher who created the task
    if (submission.taskId.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { grade, feedback, teacherComments } = req.body;

    submission.grade = grade;
    submission.feedback = feedback || submission.feedback;
    submission.teacherComments = teacherComments || submission.teacherComments;
    submission.status = 'graded';
    await submission.save();

    res.json({
      message: 'Submission graded successfully',
      submission
    });

  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Failed to grade submission' });
  }
});

// Delete submission (Student only, and only if not graded)
router.delete('/submission/:id', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user is the student who made the submission
    if (submission.studentId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow deletion if already graded
    if (submission.status === 'graded') {
      return res.status(400).json({ message: 'Cannot delete graded submission' });
    }

    // Delete files from GridFS
    for (const file of submission.files) {
      try {
        await deleteFromGridFS(file.fileId);
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
      }
    }

    await AssignmentSubmission.findByIdAndDelete(req.params.id);

    res.json({ message: 'Submission deleted successfully' });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Failed to delete submission' });
  }
});

module.exports = router;