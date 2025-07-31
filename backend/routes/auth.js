const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const { auth, trainerOnly } = require('../middleware/auth');
const router = express.Router();

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register User
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['trainer', 'client']).withMessage('Role must be trainer or client')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const { username, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    return res.status(400).json({ 
      success: false,
      message: 'User with this email or username already exists' 
    });
  }

  // Create new user with role
  const user = new User({
    username,
    email,
    password,
    role: role || 'client'
  });

  await user.save();

  // Create JWT token
  const token = jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}));

// Login User
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid credentials' 
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid credentials' 
    });
  }

  // Create JWT token
  const token = jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}));

// Get current user
router.get('/me', auth, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
}));

// Get all clients (trainers only)
router.get('/users/clients', auth, trainerOnly, asyncHandler(async (req, res) => {
  const clients = await User.find({ role: 'client' })
    .select('username email createdAt')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    count: clients.length,
    data: clients
  });
}));

// Get all trainers (for client assignment)
router.get('/users/trainers', auth, asyncHandler(async (req, res) => {
  const trainers = await User.find({ role: 'trainer' })
    .select('username email trainerProfile')
    .sort({ username: 1 });
  
  res.json({
    success: true,
    count: trainers.length,
    data: trainers
  });
}));

// Update user profile
router.put('/profile', auth, [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const { username, email } = req.body;
  const updates = {};
  
  if (username) updates.username = username;
  if (email) updates.email = email;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
}));

// Change password
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isPasswordValid) {
    return res.status(400).json({ 
      success: false,
      message: 'Current password is incorrect' 
    });
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

module.exports = router;
