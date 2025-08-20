const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, trainerOnly } = require('../middleware/auth');
const Program = require('../models/Program');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const User = require('../models/user');

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @route   GET /api/programs
// @desc    Get all programs (filtered by user role)
// @access  Private
router.get('/', auth, asyncHandler(async (req, res) => {
  let programs;
  
  if (req.user.role === 'trainer') {
    // Trainers see programs they created (both templates and client programs)
    programs = await Program.findByTrainer(req.user._id);
  } else {
    // Clients see programs assigned to them
    programs = await Program.findByClient(req.user._id);
  }
  
  res.json({
    success: true,
    count: programs.length,
    data: programs
  });
}));

// @route   GET /api/programs/templates
// @desc    Get template programs
// @access  Private (trainers only)
router.get('/templates', auth, trainerOnly, asyncHandler(async (req, res) => {
  const templates = await Program.findTemplates();
  
  res.json({
    success: true,
    count: templates.length,
    data: templates
  });
}));

// @route   GET /api/programs/client-programs
// @desc    Get client-specific programs (non-templates)
// @access  Private (trainers only)
router.get('/client-programs', auth, trainerOnly, asyncHandler(async (req, res) => {
  const clientPrograms = await Program.find({
    trainer: req.user._id,
    isTemplate: false
  }).populate('client', 'username email');
  
  res.json({
    success: true,
    count: clientPrograms.length,
    data: clientPrograms
  });
}));

// @route   GET /api/programs/search
// @desc    Search programs by name, description, or tags
// @access  Private (trainers only)
router.get('/search', auth, trainerOnly, asyncHandler(async (req, res) => {
  const { q, type, category } = req.query;
  
  let query = { trainer: req.user._id };
  
  // Search by text
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }
  
  // Filter by type
  if (type === 'templates') {
    query.isTemplate = true;
  } else if (type === 'client-programs') {
    query.isTemplate = false;
  }
  
  // Filter by category (if you add categories later)
  if (category) {
    query.category = category;
  }
  
  const programs = await Program.find(query)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email')
    .populate('client', 'username email')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    count: programs.length,
    data: programs
  });
}));

// @route   GET /api/programs/:id
// @desc    Get program by ID
// @access  Private
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email')
    .populate('client', 'username email');
  
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if user has access to this program
  if (req.user.role === 'client' && program.client?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  if (req.user.role === 'trainer' && program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  res.json({
    success: true,
    data: program
  });
}));

// @route   GET /api/programs/:id/usage
// @desc    Get program usage statistics
// @access  Private (trainers only)
router.get('/:id/usage', auth, trainerOnly, asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  // Get usage statistics
  const usageStats = {
    totalAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    averageCompletionRate: 0
  };
  
  if (program.isTemplate) {
    // For templates, find all programs based on this template
    const derivedPrograms = await Program.find({
      trainer: req.user._id,
      isTemplate: false,
      // You could add a templateId field to track this
    });
    
    usageStats.totalAssignments = derivedPrograms.length;
    usageStats.activeAssignments = derivedPrograms.filter(p => p.isActive).length;
    usageStats.completedAssignments = derivedPrograms.filter(p => p.endDate && p.endDate < new Date()).length;
    
    if (usageStats.totalAssignments > 0) {
      usageStats.averageCompletionRate = (usageStats.completedAssignments / usageStats.totalAssignments) * 100;
    }
  }
  
  res.json({
    success: true,
    data: usageStats
  });
}));

// @route   POST /api/programs
// @desc    Create a new program
// @access  Private (trainers only)
router.post('/', [
  auth,
  trainerOnly,
  body('name').trim().isLength({ min: 1 }).withMessage('Program name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Program description is required'),
  body('workoutsPerWeek').isInt({ min: 1, max: 14 }).withMessage('Workouts per week must be between 1 and 14'),
  body('duration').isInt({ min: 1, max: 52 }).withMessage('Duration must be between 1 and 52 weeks'),
  body('client').optional().custom((value) => {
    // Allow null, undefined, or valid MongoDB ObjectId
    if (value === null || value === undefined || value === '') {
      return true;
    }
    // Check if it's a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(value);
  }).withMessage('Invalid client ID'),
  body('isTemplate').optional().isBoolean().withMessage('isTemplate must be a boolean'),
  body('workouts').isArray().withMessage('Workouts must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  
  const { name, description, workoutsPerWeek, duration, client, workouts, isTemplate } = req.body;
  
  // Validate template vs client assignment
  if (isTemplate && client) {
    return res.status(400).json({ 
      success: false,
      message: 'Template programs cannot be assigned to clients' 
    });
  }
  
  // Verify all existing workouts exist and belong to the trainer
  // Only validate workouts that are NOT inline workouts
  const existingWorkoutIds = workouts
    .filter(w => w.workout && !w.isInlineWorkout)
    .map(w => w.workout);

  // Remove duplicates from workout IDs
  const uniqueWorkoutIds = [...new Set(existingWorkoutIds)];

  if (uniqueWorkoutIds.length > 0) {
    const existingWorkouts = await Workout.find({ 
      _id: { $in: uniqueWorkoutIds },
      trainer: req.user._id 
    });
    
    if (existingWorkouts.length !== uniqueWorkoutIds.length) {
      return res.status(400).json({ 
        success: false,
        message: 'One or more workouts not found or not owned by trainer' 
      });
    }
  }
  
  // Verify all exercises in inline workouts exist
  const exerciseIds = [];
  workouts.forEach(workout => {
    if (workout.isInlineWorkout && workout.exercises) {
      workout.exercises.forEach(exercise => {
        if (exercise.exercise) {
          exerciseIds.push(exercise.exercise);
        }
      });
    }
  });
  
  // Remove duplicates from exercise IDs
  const uniqueExerciseIds = [...new Set(exerciseIds)];

  if (uniqueExerciseIds.length > 0) {
    const existingExercises = await Exercise.find({ _id: { $in: uniqueExerciseIds } });
    
    if (existingExercises.length !== uniqueExerciseIds.length) {
      return res.status(400).json({ 
        success: false,
        message: 'One or more exercises not found' 
      });
    }
  }
  
  // If client is provided, verify client exists and is assigned to trainer
  if (client) {
    const clientUser = await User.findById(client);
    if (!clientUser || clientUser.role !== 'client') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid client ID' 
      });
    }
  }
  
  const programData = {
    name,
    description,
    trainer: req.user._id,
    workoutsPerWeek,
    duration,
    isTemplate: isTemplate || false,
    workouts: workouts.map(w => ({
      workout: w.workout || null,
      week: w.week,
      day: w.day,
      notes: w.notes || '',
      isInlineWorkout: w.isInlineWorkout || false,
      exercises: w.exercises || []
    }))
  };
  
  if (client) {
    programData.client = client;
    programData.startDate = new Date();
  }
  
  const program = new Program(programData);
  await program.save();
  
  const populatedProgram = await Program.findById(program._id)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email')
    .populate('client', 'username email');
  
  res.status(201).json({
    success: true,
    message: isTemplate ? 'Template created successfully' : 'Program created successfully',
    data: populatedProgram
  });
}));

// @route   PUT /api/programs/:id
// @desc    Update a program
// @access  Private (trainers only)
router.put('/:id', [
  auth,
  trainerOnly,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Program name cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Program description cannot be empty'),
  body('workoutsPerWeek').optional().isInt({ min: 1, max: 14 }).withMessage('Workouts per week must be between 1 and 14'),
  body('duration').optional().isInt({ min: 1, max: 52 }).withMessage('Duration must be between 1 and 52 weeks'),
  body('client').optional().custom((value) => {
    // Allow null, undefined, or valid MongoDB ObjectId
    if (value === null || value === undefined || value === '') {
      return true;
    }
    // Check if it's a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(value);
  }).withMessage('Invalid client ID'),
  body('isTemplate').optional().isBoolean().withMessage('isTemplate must be a boolean'),
  body('workouts').optional().isArray().withMessage('Workouts must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  const { name, description, workoutsPerWeek, duration, client, workouts, isTemplate } = req.body;
  
  // Validate template vs client assignment
  if (isTemplate && client) {
    return res.status(400).json({ 
      success: false,
      message: 'Template programs cannot be assigned to clients' 
    });
  }
  
  // Update program fields
  if (name !== undefined) program.name = name;
  if (description !== undefined) program.description = description;
  if (workoutsPerWeek !== undefined) program.workoutsPerWeek = workoutsPerWeek;
  if (duration !== undefined) program.duration = duration;
  if (isTemplate !== undefined) program.isTemplate = isTemplate;
  
  // Handle client assignment
  if (client !== undefined) {
    if (client) {
      // Verify client exists
      const clientUser = await User.findById(client);
      if (!clientUser || clientUser.role !== 'client') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid client ID' 
        });
      }
      program.client = client;
      program.startDate = new Date();
    } else {
      program.client = null;
    }
  }
  
  // Update workouts if provided
  if (workouts) {
    // Validate workouts with deduplication
    const existingWorkoutIds = workouts
      .filter(w => w.workout && !w.isInlineWorkout)
      .map(w => w.workout);
    
    const uniqueWorkoutIds = [...new Set(existingWorkoutIds)];
    
    if (uniqueWorkoutIds.length > 0) {
      const existingWorkouts = await Workout.find({ 
        _id: { $in: uniqueWorkoutIds },
        trainer: req.user._id 
      });
      
      if (existingWorkouts.length !== uniqueWorkoutIds.length) {
        return res.status(400).json({ 
          success: false,
          message: 'One or more workouts not found or not owned by trainer' 
        });
      }
    }
    
    // Validate exercises with deduplication
    const exerciseIds = [];
    workouts.forEach(workout => {
      if (workout.isInlineWorkout && workout.exercises) {
        workout.exercises.forEach(exercise => {
          if (exercise.exercise) {
            exerciseIds.push(exercise.exercise);
          }
        });
      }
    });
    
    const uniqueExerciseIds = [...new Set(exerciseIds)];
    
    if (uniqueExerciseIds.length > 0) {
      const existingExercises = await Exercise.find({ _id: { $in: uniqueExerciseIds } });
      
      if (existingExercises.length !== uniqueExerciseIds.length) {
        return res.status(400).json({ 
          success: false,
          message: 'One or more exercises not found' 
        });
      }
    }
    
    program.workouts = workouts.map(w => ({
      workout: w.workout || null,
      week: w.week,
      day: w.day,
      notes: w.notes || '',
      isInlineWorkout: w.isInlineWorkout || false,
      exercises: w.exercises || []
    }));
  }
  
  await program.save();
  
  const updatedProgram = await Program.findById(program._id)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email')
    .populate('client', 'username email');
  
  res.json({
    success: true,
    message: 'Program updated successfully',
    data: updatedProgram
  });
}));

// @route   DELETE /api/programs/:id
// @desc    Delete a program
// @access  Private (trainers only)
router.delete('/:id', auth, trainerOnly, asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  await Program.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Program deleted successfully'
  });
}));

// @route   POST /api/programs/:id/assign
// @desc    Assign a template program to a client
// @access  Private (trainers only)
router.post('/:id/assign', [
  auth,
  trainerOnly,
  body('clientId').isMongoId().withMessage('Valid client ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  
  const { clientId } = req.body;
  
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  // Verify client exists and is assigned to trainer
  const clientUser = await User.findById(clientId);
  if (!clientUser || clientUser.role !== 'client') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid client ID' 
    });
  }
  
  // Create a new program instance for the client (copy the template)
  const clientProgram = new Program({
    name: program.name,
    description: program.description,
    trainer: req.user._id,
    client: clientId,
    workoutsPerWeek: program.workoutsPerWeek,
    duration: program.duration,
    isTemplate: false,
    workouts: program.workouts,
    startDate: new Date()
  });
  
  await clientProgram.save();
  
  const populatedProgram = await Program.findById(clientProgram._id)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email')
    .populate('client', 'username email');
  
  res.status(201).json({
    success: true,
    message: 'Program assigned to client successfully',
    data: populatedProgram
  });
}));

// @route   POST /api/programs/:id/duplicate
// @desc    Duplicate a program (template or client program)
// @access  Private (trainers only)
router.post('/:id/duplicate', auth, trainerOnly, asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  // Create duplicate
  const duplicatedProgram = new Program({
    name: `${program.name} (Copy)`,
    description: program.description,
    trainer: req.user._id,
    client: program.client, // Keep same client if it's a client program
    workoutsPerWeek: program.workoutsPerWeek,
    duration: program.duration,
    isTemplate: program.isTemplate,
    workouts: program.workouts,
    startDate: program.isTemplate ? null : new Date()
  });
  
  await duplicatedProgram.save();
  
  const populatedProgram = await Program.findById(duplicatedProgram._id)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email')
    .populate('client', 'username email');
  
  res.status(201).json({
    success: true,
    message: 'Program duplicated successfully',
    data: populatedProgram
  });
}));

// @route   POST /api/programs/:id/share
// @desc    Share a program with another trainer
// @access  Private (trainers only)
router.post('/:id/share', [
  auth,
  trainerOnly,
  body('trainerEmail').isEmail().withMessage('Valid trainer email is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  
  const { trainerEmail } = req.body;
  
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  // Find the target trainer
  const targetTrainer = await User.findOne({ 
    email: trainerEmail, 
    role: 'trainer' 
  });
  
  if (!targetTrainer) {
    return res.status(404).json({ 
      success: false,
      message: 'Trainer not found' 
    });
  }
  
  // Create shared program
  const sharedProgram = new Program({
    name: program.name,
    description: program.description,
    trainer: targetTrainer._id,
    client: null, // Remove client assignment when sharing
    workoutsPerWeek: program.workoutsPerWeek,
    duration: program.duration,
    isTemplate: true, // Always share as template
    workouts: program.workouts,
    sharedFrom: req.user._id, // Track who shared it
    sharedAt: new Date()
  });
  
  await sharedProgram.save();
  
  const populatedProgram = await Program.findById(sharedProgram._id)
    .populate('workouts.workout')
    .populate('workouts.exercises.exercise')
    .populate('trainer', 'username email');
  
  res.status(201).json({
    success: true,
    message: 'Program shared successfully',
    data: populatedProgram
  });
}));

// @route   GET /api/programs/analytics
// @desc    Get program analytics for trainer
// @access  Private (trainers only)
router.get('/analytics', auth, trainerOnly, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  }
  
  try {
    // Get program statistics
    const totalPrograms = await Program.countDocuments({
      trainer: req.user._id,
      ...dateFilter
    });
    
    const templates = await Program.countDocuments({
      trainer: req.user._id,
      isTemplate: true,
      ...dateFilter
    });
    
    const clientPrograms = await Program.countDocuments({
      trainer: req.user._id,
      isTemplate: false,
      ...dateFilter
    });
    
    const activePrograms = await Program.countDocuments({
      trainer: req.user._id,
      isActive: true,
      ...dateFilter
    });
    
    // Get most used templates (with error handling)
    let mostUsedTemplates = [];
    try {
      mostUsedTemplates = await Program.aggregate([
        {
          $match: {
            trainer: req.user._id,
            isTemplate: true
          }
        },
        {
          $lookup: {
            from: 'programs',
            localField: '_id',
            foreignField: 'templateId',
            as: 'derivedPrograms'
          }
        },
        {
          $project: {
            name: 1,
            usageCount: { $size: '$derivedPrograms' }
          }
        },
        {
          $sort: { usageCount: -1 }
        },
        {
          $limit: 5
        }
      ]);
    } catch (aggregateError) {
      console.log('Aggregation failed, returning empty array:', aggregateError.message);
      mostUsedTemplates = [];
    }
    
    res.json({
      success: true,
      data: {
        totalPrograms,
        templates,
        clientPrograms,
        activePrograms,
        mostUsedTemplates
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analytics',
      error: error.message
    });
  }
}));

// @route   POST /api/programs/:id/archive
// @desc    Archive/unarchive a program
// @access  Private (trainers only)
router.post('/:id/archive', auth, trainerOnly, asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  
  if (!program) {
    return res.status(404).json({ 
      success: false,
      message: 'Program not found' 
    });
  }
  
  // Check if trainer owns this program
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  
  // Toggle archive status
  program.isActive = !program.isActive;
  await program.save();
  
  res.json({
    success: true,
    message: program.isActive ? 'Program unarchived successfully' : 'Program archived successfully',
    data: { isActive: program.isActive }
  });
}));

module.exports = router; 