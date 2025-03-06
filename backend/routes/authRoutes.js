const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { loginUser } = require('../controllers/userController');

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    const errors = {};
    
    if (!username) {
      errors.username = 'Username is required';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        errors.email = 'Email already registered';
      }
      if (existingUser.username === username) {
        errors.username = 'Username already taken';
      }
    }

    // If there are any validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors 
      });
    }

    // Create new user
    const user = await User.create({
      name: username, // Use username as name
      email,
      password,
      role: role || 'student' // Default to student if no role provided
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        name: user.name
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration Error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
});

// Login route
router.post('/login', loginUser);

module.exports = router; 