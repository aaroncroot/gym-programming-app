const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const { auth, trainerOnly, clientOnly } = require('../middleware/auth');
const emailService = require('../services/emailService');
const router = express.Router();
const { authValidation, sanitizeInput } = require('../middleware/validation');
const { logger } = require('../middleware/logging');

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register User
router.post('/register', 
  sanitizeInput,
  authValidation.register,
  async (req, res) => {
    try {
      logger.info('User registration attempt', {
        email: req.body.email,
        role: req.body.role,
        ip: req.ip || req.connection.remoteAddress
      });

      const { 
        username, 
        email, 
        password, 
        firstName, 
        lastName, 
        role, 
        location, 
        selectedTrainer 
      } = req.body;

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

      // Validate trainer if client is registering
      let trainer = null;
      if (role === 'client' && selectedTrainer) {
        trainer = await User.findOne({ 
          _id: selectedTrainer, 
          role: 'trainer',
          isVerified: true,
          isActive: true
        });
        
        if (!trainer) {
          return res.status(400).json({ 
            success: false,
            message: 'Selected trainer not found or not available' 
          });
        }
      }

      // Create user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        location,
        assignedTrainer: role === 'client' ? selectedTrainer : null,
        pendingTrainerApproval: role === 'client' && selectedTrainer ? true : false
      });

      // Generate verification token
      const verificationToken = user.generateVerificationToken();
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user, verificationToken);
        
        // Send trainer notification if client registered
        if (role === 'client' && trainer) {
          await emailService.sendTrainerNotification(trainer, user);
        }
      } catch (error) {
        console.error('Email sending failed:', error);
        // Don't fail registration if email fails
      }

      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          pendingTrainerApproval: user.pendingTrainerApproval
        }
      });
    } catch (error) {
      logger.error('User registration failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip || req.connection.remoteAddress
      });

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Verify Email
router.get('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ 
      success: false,
      message: 'Verification token is required' 
    });
  }

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid or expired verification token' 
    });
  }

  // Mark user as verified
  user.isVerified = true;
  user.verifiedAt = new Date();
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (error) {
    console.error('Welcome email failed:', error);
  }

  res.json({
    success: true,
    message: 'Email verified successfully! You can now log in.',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      pendingTrainerApproval: user.pendingTrainerApproval
    }
  });
}));

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const { email } = req.body;
  
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'User not found' 
    });
  }

  if (user.isVerified) {
    return res.status(400).json({ 
      success: false,
      message: 'Email is already verified' 
    });
  }

  // Generate new verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user, verificationToken);
  } catch (error) {
    console.error('Email sending failed:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to send verification email' 
    });
  }

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
}));

// Get Available Trainers
router.get('/trainers', asyncHandler(async (req, res) => {
  const { country, city } = req.query;
  
  let query = {
    role: 'trainer',
    'trainerProfile.isPublic': true
  };

  if (country) {
    query['location.country'] = { $regex: country, $options: 'i' };
  }

  if (city) {
    query['location.city'] = { $regex: city, $options: 'i' };
  }

  const trainers = await User.find(query)
    .select('firstName lastName location trainerProfile')
    .sort({ 'trainerProfile.experience': -1 });

  res.json({
    success: true,
    trainers  // Changed from 'data' to 'trainers' to match frontend expectation
  });
}));

// @route   GET /api/auth/countries
// @desc    Get list of countries and cities
// @access  Public
router.get('/countries', asyncHandler(async (req, res) => {
  const countries = [
    {
      name: 'United States',
      cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']
    },
    {
      name: 'Canada',
      cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener']
    },
    {
      name: 'United Kingdom',
      cities: ['London', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Edinburgh', 'Liverpool', 'Manchester', 'Bristol']
    },
    {
      name: 'Australia',
      cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong']
    }
  ];
  
  res.json({ 
    success: true, 
    countries 
  });
}));

// Login User
router.post('/login', 
  sanitizeInput,
  authValidation.login,
  async (req, res) => {
    try {
      logger.info('User login attempt', {
        email: req.body.email,
        ip: req.ip || req.connection.remoteAddress
      });

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

      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email
      });

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
    } catch (error) {
      logger.error('User login failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip || req.connection.remoteAddress
      });

      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

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

// Add this route to your existing auth.js file

// @route   POST /api/auth/trainer/clients
// @desc    Add a client to trainer's client list
// @access  Private (trainers only)
router.post('/trainer/clients', [
  auth,
  trainerOnly,
  body('clientEmail').isEmail().withMessage('Valid client email is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  
  const { clientEmail } = req.body;
  
  // Find the client
  const client = await User.findOne({ 
    email: clientEmail, 
    role: 'client' 
  });
  
  if (!client) {
    return res.status(404).json({ 
      success: false,
      message: 'Client not found' 
    });
  }
  
  // Check if client is already assigned to this trainer
  const existingAssignment = await User.findOne({
    _id: client._id,
    assignedTrainer: req.user._id
  });
  
  if (existingAssignment) {
    return res.status(400).json({ 
      success: false,
      message: 'Client is already assigned to you' 
    });
  }
  
  // Assign client to trainer
  client.assignedTrainer = req.user._id;
  await client.save();
  
  res.json({
    success: true,
    message: 'Client assigned successfully',
    data: {
      clientId: client._id,
      clientName: client.username,
      clientEmail: client.email
    }
  });
}));

// @route   GET /api/auth/trainer/clients
// @desc    Get all clients assigned to trainer
// @access  Private (trainers only)
router.get('/trainer/clients', auth, trainerOnly, asyncHandler(async (req, res) => {
  const clients = await User.find({ 
    assignedTrainer: req.user._id,
    role: 'client'
  }).select('username email createdAt');
  
  res.json({
    success: true,
    data: clients
  });
}));

// @route   DELETE /api/auth/trainer/clients/:clientId
// @desc    Remove a client from trainer's client list
// @access  Private (trainers only)
router.delete('/trainer/clients/:clientId', auth, trainerOnly, asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  
  // Find the client and verify they're assigned to this trainer
  const client = await User.findOne({ 
    _id: clientId,
    assignedTrainer: req.user._id,
    role: 'client'
  });
  
  if (!client) {
    return res.status(404).json({ 
      success: false,
      message: 'Client not found or not assigned to you' 
    });
  }
  
  // Remove the assignment
  client.assignedTrainer = null;
  await client.save();
  
  res.json({
    success: true,
    message: 'Client removed successfully',
    data: {
      clientId: client._id,
      clientName: client.username,
      clientEmail: client.email
    }
  });
}));

// @route   GET /api/auth/trainer/available-clients
// @desc    Get all clients not assigned to any trainer
// @access  Private (trainers only)
router.get('/trainer/available-clients', auth, trainerOnly, asyncHandler(async (req, res) => {
  const availableClients = await User.find({ 
    role: 'client',
    assignedTrainer: { $exists: false }
  }).select('username email createdAt');
  
  res.json({
    success: true,
    data: availableClients
  });
}));

// @route   GET /api/auth/client/my-trainer
// @desc    Get the trainer assigned to the current client
// @access  Private (clients only)
router.get('/client/my-trainer', auth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Only clients can access this endpoint.' 
    });
  }
  
  const client = await User.findById(req.user._id).populate('assignedTrainer', 'username email');
  
  if (!client.assignedTrainer) {
    return res.status(404).json({ 
      success: false,
      message: 'No trainer assigned' 
    });
  }
  
  res.json({
    success: true,
    data: client.assignedTrainer
  });
}));

// Get Pending Client Requests (for trainers)
router.get('/trainer/pending-clients', auth, trainerOnly, asyncHandler(async (req, res) => {
  const pendingClients = await User.find({
    'pendingTrainerRequest.trainer': req.user._id,
    'pendingTrainerRequest.status': 'pending'
  }).select('firstName lastName email location createdAt pendingTrainerRequest');

  res.json({
    success: true,
    data: pendingClients
  });
}));

// Approve/Reject Client Request
router.post('/trainer/client-request/:clientId', [
  auth,
  trainerOnly,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const { clientId } = req.params;
  const { action } = req.body;

  const client = await User.findOne({
    _id: clientId,
    'pendingTrainerRequest.trainer': req.user._id,
    'pendingTrainerRequest.status': 'pending'
  });

  if (!client) {
    return res.status(404).json({ 
      success: false,
      message: 'Client request not found' 
    });
  }

  if (action === 'approve') {
    // Approve the client
    client.pendingTrainerRequest.status = 'approved';
    client.assignedTrainer = req.user._id;
    client.isEmailVerified = true; // Auto-verify if trainer approves
  } else {
    // Reject the client
    client.pendingTrainerRequest.status = 'rejected';
  }

  await client.save();

  // Send approval/rejection email
  try {
    await emailService.sendClientApprovalEmail(client, action === 'approve');
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }

  res.json({
    success: true,
    message: `Client request ${action}d successfully`
  });
}));

// @route   GET /api/auth/trainer/pending-clients
// @desc    Get pending client requests for trainer
// @access  Private (trainers only)
router.get('/trainer/pending-clients', auth, trainerOnly, asyncHandler(async (req, res) => {
  const pendingClients = await User.find({
    role: 'client',
    assignedTrainer: req.user._id,
    isVerified: true,
    pendingTrainerApproval: true,
    isActive: true
  }).select('firstName lastName email username location createdAt');
  
  res.json({
    success: true,
    clients: pendingClients
  });
}));

// @route   POST /api/auth/trainer/approve-client/:clientId
// @desc    Approve a client request
// @access  Private (trainers only)
router.post('/trainer/approve-client/:clientId', auth, trainerOnly, asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  
  const client = await User.findOne({
    _id: clientId,
    role: 'client',
    assignedTrainer: req.user._id,
    pendingTrainerApproval: true,
    isVerified: true
  });
  
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client request not found'
    });
  }
  
  // Approve the client
  client.pendingTrainerApproval = false;
  client.isApprovedByTrainer = true;
  client.approvedAt = new Date();
  await client.save();
  
  // Add client to trainer's client list
  const trainer = await User.findById(req.user._id);
  if (!trainer.clients.includes(clientId)) {
    trainer.clients.push(clientId);
    await trainer.save();
  }
  
  // Send approval notification email
  try {
    await emailService.sendClientApprovalEmail(client, trainer);
  } catch (error) {
    console.error('Approval email failed:', error);
  }
  
  res.json({
    success: true,
    message: 'Client approved successfully',
    client: {
      id: client._id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email
    }
  });
}));

// @route   POST /api/auth/trainer/reject-client/:clientId
// @desc    Reject a client request
// @access  Private (trainers only)
router.post('/trainer/reject-client/:clientId', auth, trainerOnly, asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  
  const client = await User.findOne({
    _id: clientId,
    role: 'client',
    assignedTrainer: req.user._id,
    pendingTrainerApproval: true
  });
  
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client request not found'
    });
  }
  
  // Remove trainer assignment and reset approval status
  client.assignedTrainer = null;
  client.pendingTrainerApproval = false;
  client.isApprovedByTrainer = false;
  await client.save();
  
  // Send rejection notification email
  try {
    await emailService.sendClientRejectionEmail(client);
  } catch (error) {
    console.error('Rejection email failed:', error);
  }
  
  res.json({
    success: true,
    message: 'Client request rejected',
    client: {
      id: client._id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email
    }
  });
}));

// Add this endpoint BEFORE module.exports = router;

// @route   POST /api/auth/trainer/clients
// @desc    Assign a client to trainer
// @access  Private (trainers only)
router.post('/trainer/clients', auth, trainerOnly, asyncHandler(async (req, res) => {
  const { clientEmail } = req.body;
  
  if (!clientEmail) {
    return res.status(400).json({
      success: false,
      message: 'Client email is required'
    });
  }
  
  // Find the client by email
  const client = await User.findOne({ 
    email: clientEmail, 
    role: 'client' 
  });
  
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }
  
  if (client.assignedTrainer) {
    return res.status(400).json({
      success: false,
      message: 'Client is already assigned to a trainer'
    });
  }
  
  // Assign client to trainer
  client.assignedTrainer = req.user._id;
  client.pendingTrainerApproval = true;
  await client.save();
  
  // Add to trainer's client list
  const trainer = await User.findById(req.user._id);
  if (!trainer.clients.includes(client._id)) {
    trainer.clients.push(client._id);
    await trainer.save();
  }
  
  res.json({
    success: true,
    message: 'Client assigned successfully',
    client: {
      id: client._id,
      email: client.email,
      username: client.username
    }
  });
}));

module.exports = router;
