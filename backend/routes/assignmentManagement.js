const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const { upload, uploadToGridFS, deleteFromGridFS } = require('../middleware/upload');

const router = express.Router();

// Get all assignments created by teacher
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.userId })
      .populate('assignedTo', 'name studentId department year')
      .sort({ createdAt: -1 });
    
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments for a specific student (for student view)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find student to get their department and year
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find assignments assigned to this student (individual, department, or year-based)
    const assignments = await Assignment.find({
      $or: [
        { assignedTo: studentId },
        { assignmentType: 'department', targetDepartment: student.department },
        { assignmentType: 'year', targetYear: student.year }
      ],
      status: 'active'
    })
    .populate('createdBy', 'name department')
    .sort({ dueDate: 1 });
    
    res.json(assignments);
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new assignment
router.post('/', [
  auth,
  upload.array('referenceFiles', 5),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('instructions').optional().trim(),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('maxMarks').optional().isInt({ min: 0 }).withMessage('Max marks must be a positive number'),
  body('assignmentType').isIn(['individual', 'department', 'year']).withMessage('Invalid assignment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignmentData = {
      ...req.body,
      createdBy: req.userId
    };

    // Handle reference file uploads
    if (req.files && req.files.length > 0) {
      const referenceFiles = [];
      for (const file of req.files) {
        const fileId = await uploadToGridFS(file);
        referenceFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          fileId: fileId
        });
      }
      assignmentData.referenceFiles = referenceFiles;
    }

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('assignedTo', 'name studentId department year')
      .populate('createdBy', 'name department');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('maxMarks').optional().isInt({ min: 0 }).withMessage('Max marks must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await Assignment.findOne({ 
      _id: req.params.id, 
      createdBy: req.userId 
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    Object.assign(assignment, req.body);
    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('assignedTo', 'name studentId department year')
      .populate('createdBy', 'name department');

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ 
      _id: req.params.id, 
      createdBy: req.userId 
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Delete reference files from GridFS
    if (assignment.referenceFiles && assignment.referenceFiles.length > 0) {
      for (const file of assignment.referenceFiles) {
        if (file.fileId) {
          await deleteFromGridFS(file.fileId);
        }
      }
    }

    await Assignment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download reference file
router.get('/download/:assignmentId/:fileIndex', auth, async (req, res) => {
  try {
    const { assignmentId, fileIndex } = req.params;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const file = assignment.referenceFiles[parseInt(fileIndex)];
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await downloadFromGridFS(file.fileId, file.originalName, res);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
