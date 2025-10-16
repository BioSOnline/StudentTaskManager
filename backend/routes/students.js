const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all students for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = { createdBy: req.userId };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const students = await Student.find(filter).sort(sortOptions);
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single student
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, createdBy: req.userId });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new student
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Name is required'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('year').optional().isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId } = req.body;

    // Check if student ID already exists for this user
    const existingStudent = await Student.findOne({ 
      studentId, 
      createdBy: req.userId 
    });
    
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    const studentData = {
      ...req.body,
      createdBy: req.userId
    };

    const student = new Student(studentData);
    await student.save();

    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('studentId').optional().notEmpty().withMessage('Student ID cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('year').optional().isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If updating studentId, check for uniqueness
    if (req.body.studentId) {
      const existingStudent = await Student.findOne({ 
        studentId: req.body.studentId, 
        createdBy: req.userId,
        _id: { $ne: req.params.id }
      });
      
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;