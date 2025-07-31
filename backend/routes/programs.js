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
    // Trainers see programs they created
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
  body('client').optional().isMongoId().withMessage('Invalid client ID'),
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
  
  const { name, description, workoutsPerWeek, duration, client, workouts } = req.body;
  
  // Verify all existing workouts exist and belong to the trainer
  const existingWorkoutIds = workouts.filter(w => w.workout && !w.isInlineWorkout).map(w => w.workout);
  if (existingWorkoutIds.length > 0) {
    const existingWorkouts = await Workout.find({ 
      _id: { $in: existingWorkoutIds },
      trainer: req.user._id 
    });
    
    if (existingWorkouts.length !== existingWorkoutIds.length) {
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
  
  if (exerciseIds.length > 0) {
    const existingExercises = await Exercise.find({ _id: { $in: exerciseIds } });
    if (existingExercises.length !== exerciseIds.length) {
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
    programData.isTemplate = false;
    programData.startDate = new Date();
  } else {
    programData.isTemplate = true;
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
    message: 'Program created successfully',
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
  body('duration').optional().isInt({ min: 1, max: 52 }).withMessage('Duration must be between 1 and 52 weeks')
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
  
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only update your own programs.' 
    });
  }
  
  // Update allowed fields
  const allowedUpdates = ['name', 'description', 'workoutsPerWeek', 'duration', 'isActive'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      program[field] = req.body[field];
    }
  });
  
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
  
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only delete your own programs.' 
    });
  }
  
  await Program.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Program deleted successfully'
  });
}));

// @route   POST /api/programs/:id/assign
// @desc    Assign program to client
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
  
  if (program.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only assign your own programs.' 
    });
  }
  
  // Verify client exists and is a client
  const client = await User.findById(clientId);
  if (!client || client.role !== 'client') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid client ID' 
    });
  }
  
  // Create a new program instance for the client
  const clientProgram = new Program({
    name: program.name,
    description: program.description,
    trainer: req.user._id,
    client: clientId,
    workoutsPerWeek: program.workoutsPerWeek,
    duration: program.duration,
    workouts: program.workouts,
    isTemplate: false,
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

module.exports = router; 