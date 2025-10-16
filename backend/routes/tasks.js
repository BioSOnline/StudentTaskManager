const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { upload, uploadToGridFS, downloadFromGridFS } = require('../middleware/upload');

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, priority, studentId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = { createdBy: req.userId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (studentId) filter.assignedTo = studentId;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name studentId email')
      .sort(sortOptions);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.userId })
      .populate('assignedTo', 'name studentId email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task with file uploads
router.post('/', [
  auth,
  upload.array('attachments', 10), // Allow up to 10 file attachments
  body('title').notEmpty().withMessage('Title is required'),
  body('assignedTo').notEmpty().withMessage('Student assignment is required'),
  body('category').optional().isIn(['homework', 'project', 'exam', 'assignment', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify that the student belongs to the current user
    const Student = require('../models/Student');
    const student = await Student.findOne({ 
      _id: req.body.assignedTo, 
      createdBy: req.userId 
    });
    
    if (!student) {
      return res.status(400).json({ message: 'Student not found or not accessible' });
    }

    // Handle file attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const fileId = await uploadToGridFS(file, {
            uploadedBy: req.userId,
            uploadDate: new Date(),
            taskId: 'pending' // Will be updated after task creation
          });
          
          attachments.push({
            filename: `${Date.now()}-${file.originalname}`,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            fileId: fileId
          });
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload files' });
      }
    }

    // Parse arrays from form data
    const allowedFileTypes = typeof req.body.allowedFileTypes === 'string' 
      ? JSON.parse(req.body.allowedFileTypes) 
      : req.body.allowedFileTypes || ['pdf', 'doc', 'docx'];

    const taskData = {
      ...req.body,
      createdBy: req.userId,
      attachments,
      allowedFileTypes,
      maxFileSize: req.body.maxFileSize || 10 * 1024 * 1024 // Default 10MB
    };

    const task = new Task(taskData);
    await task.save();
    
    // Populate student data before returning
    await task.populate('assignedTo', 'name studentId email');

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('assignedTo').optional().notEmpty().withMessage('Student assignment cannot be empty'),
  body('category').optional().isIn(['homework', 'project', 'exam', 'assignment', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating assignedTo, verify that the student belongs to the current user
    if (req.body.assignedTo) {
      const Student = require('../models/Student');
      const student = await Student.findOne({ 
        _id: req.body.assignedTo, 
        createdBy: req.userId 
      });
      
      if (!student) {
        return res.status(400).json({ message: 'Student not found or not accessible' });
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name studentId email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download task attachment
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const fileData = await downloadFromGridFS(req.params.fileId);
    
    res.set({
      'Content-Type': fileData.file.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileData.file.filename}"`,
      'Content-Length': fileData.file.length
    });
    
    fileData.stream.pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(404).json({ message: 'File not found' });
  }
});

module.exports = router;