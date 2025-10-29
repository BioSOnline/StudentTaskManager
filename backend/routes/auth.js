const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, studentId, year, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ 
      name, 
      email, 
      password, 
      role: role || 'student',
      studentId, 
      year, 
      department 
    });
    await user.save();

    // If the user is a student, automatically add them to teachers from same department only
    if (user.role === 'student' && studentId && user.department) {
      try {
        // Find teachers from the same department only
        const teachers = await User.find({ 
          role: 'teacher', 
          department: user.department 
        });
        
        console.log(`Found ${teachers.length} teachers in ${user.department} department for student ${user.name}`);
        
        // Create student record for each teacher in the same department
        const studentPromises = teachers.map(teacher => {
          const student = new Student({
            name: user.name,
            studentId: user.studentId,
            email: user.email,
            year: user.year,
            department: user.department,
            createdBy: teacher._id
          });
          return student.save().then(() => {
            console.log(`Added student ${user.name} to teacher ${teacher.name}`);
          }).catch(err => {
            // Handle duplicate studentId per teacher silently
            if (err.code !== 11000) {
              console.error('Error creating student record:', err);
            } else {
              console.log(`Student ${user.name} already exists for teacher ${teacher.name}`);
            }
          });
        });
        
        await Promise.all(studentPromises);
        console.log(`Successfully added student ${user.name} to all teachers in ${user.department}`);
      } catch (error) {
        console.error('Error adding student to teachers:', error);
        // Don't fail registration if student creation fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        year: user.year,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        year: user.year,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;