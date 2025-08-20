const express = require('express');
const { body, validationResult } = require('express-validator');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const { auth, trainerOnly } = require('../middleware/auth');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const mongoose = require('mongoose');

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all workouts for a user (trainer sees their created workouts, client sees assigned workouts)
router.get('/', auth, asyncHandler(async (req, res) => {
  let workouts;
  
  if (req.user.role === 'trainer') {
    // Trainers see workouts they've created (including unassigned ones)
    workouts = await Workout.find({ trainer: req.user._id })
      .populate('client', 'username email')
      .populate('exercises.exercise')
      .sort({ createdAt: -1 });
  } else {
    // Clients see workouts assigned to them
    workouts = await Workout.find({ client: req.user._id })
      .populate('trainer', 'username email')
      .populate('exercises.exercise')
      .sort({ createdAt: -1 });
  }
  
  res.json({
    success: true,
    count: workouts.length,
    data: workouts
  });
}));

// Get specific workout
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id)
    .populate('trainer', 'username email')
    .populate('client', 'username email')
    .populate('exercises.exercise');
  
  if (!workout) {
    return res.status(404).json({ 
      success: false,
      message: 'Workout not found' 
    });
  }

  // Check if user has access to this workout
  if (req.user.role === 'trainer' && workout.trainer._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to view this workout' 
    });
  }
  
  if (req.user.role === 'client' && workout.client._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to view this workout' 
    });
  }

  res.json({
    success: true,
    data: workout
  });
}));

// Create new workout (trainers only)
router.post('/', [
  auth,
  trainerOnly,
  body('name').trim().isLength({ min: 1 }).withMessage('Workout name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Workout description is required'),
  body('client').optional().isMongoId().withMessage('Invalid client ID'),
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required'),
  body('exercises.*.exercise').isMongoId().withMessage('Valid exercise ID is required'),
  body('exercises.*.sets').isInt({ min: 1 }).withMessage('Sets must be at least 1'),
  body('exercises.*.reps').isInt({ min: 1 }).withMessage('Reps must be at least 1'),
  body('exercises.*.weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('exercises.*.duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  body('exercises.*.restTime').optional().isInt({ min: 0 }).withMessage('Rest time must be a positive number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const {
    name,
    description,
    client,
    exercises
  } = req.body;

  // Verify all exercises exist
  const exerciseIds = exercises.map(ex => ex.exercise);
  const existingExercises = await Exercise.find({ _id: { $in: exerciseIds } });
  
  if (existingExercises.length !== exerciseIds.length) {
    return res.status(400).json({ 
      success: false,
      message: 'One or more exercises not found' 
    });
  }

  const workout = new Workout({
    name,
    description,
    trainer: req.user._id,
    client: client || null,
    exercises,
    // Set default values for frequency and duration (these are more relevant to programs)
    frequency: '3x-week',
    duration: 4
  });

  await workout.save();
  
  const populatedWorkout = await Workout.findById(workout._id)
    .populate('trainer', 'username email')
    .populate('client', 'username email')
    .populate('exercises.exercise');
  
  res.status(201).json({
    success: true,
    message: 'Workout created successfully',
    data: populatedWorkout
  });
}));

// Update workout (only creator can update)
router.put('/:id', [
  auth,
  trainerOnly,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Workout name cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Workout description cannot be empty')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const workout = await Workout.findById(req.params.id);
  
  if (!workout) {
    return res.status(404).json({ 
      success: false,
      message: 'Workout not found' 
    });
  }
  
  if (workout.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to update this workout' 
    });
  }

  const updatedWorkout = await Workout.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('trainer', 'username email')
    .populate('client', 'username email')
    .populate('exercises.exercise');

  res.json({
    success: true,
    message: 'Workout updated successfully',
    data: updatedWorkout
  });
}));

// Delete workout (only creator can delete)
router.delete('/:id', auth, trainerOnly, asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  
  if (!workout) {
    return res.status(404).json({ 
      success: false,
      message: 'Workout not found' 
    });
  }
  
  if (workout.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to delete this workout' 
    });
  }

  await Workout.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Workout deleted successfully'
  });
}));

// Assign workout to client
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
  
  const workout = await Workout.findById(req.params.id);
  
  if (!workout) {
    return res.status(404).json({ 
      success: false,
      message: 'Workout not found' 
    });
  }
  
  if (workout.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to assign this workout' 
    });
  }
  
  workout.client = clientId;
  await workout.save();
  
  const updatedWorkout = await Workout.findById(workout._id)
    .populate('trainer', 'username email')
    .populate('client', 'username email')
    .populate('exercises.exercise');

  res.json({
    success: true,
    message: 'Workout assigned to client successfully',
    data: updatedWorkout
  });
}));

// @route   POST /api/workouts/log
// @desc    Log a completed workout
// @access  Private
router.post('/log', auth, asyncHandler(async (req, res) => {
  const {
    workoutId,
    programId,
    exercises,
    startTime,
    endTime,
    notes,
    rating,
    difficulty
  } = req.body;

  // Validate required fields
  if (!exercises || !Array.isArray(exercises)) {
    return res.status(400).json({
      success: false,
      message: 'Exercises array is required'
    });
  }

  // Create workout log
  const workoutLog = new WorkoutLog({
    user: req.user._id,
    program: programId,
    workout: workoutId,
    exercises: exercises.map(exercise => ({
      exercise: exercise.exerciseId,
      sets: exercise.sets || [], // Array of individual set data
      completed: exercise.completed,
      notes: exercise.notes || ''
    })),
    startTime: startTime ? new Date(startTime) : new Date(),
    endTime: endTime ? new Date(endTime) : new Date(),
    notes: notes || '',
    rating: rating || null,
    difficulty: difficulty || null
  });

  await workoutLog.save();

  const populatedLog = await WorkoutLog.findById(workoutLog._id)
    .populate('program', 'name')
    .populate('workout', 'name')
    .populate('exercises.exercise', 'name category muscleGroup');

  res.status(201).json({
    success: true,
    message: 'Workout logged successfully',
    data: populatedLog
  });
}));

// @route   GET /api/workouts/history
// @desc    Get user's workout history
// @access  Private
router.get('/history', auth, asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  
  const history = await WorkoutLog.getUserHistory(req.user._id, parseInt(limit));
  
  res.json({
    success: true,
    count: history.length,
    data: history
  });
}));

// Complete the stats endpoint
router.get('/stats', auth, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const stats = await WorkoutLog.getUserStats(req.user._id, parseInt(days));
  
  res.json({
    success: true,
    data: stats[0] || {
      totalWorkouts: 0,
      totalDuration: 0,
      averageRating: 0,
      completedWorkouts: 0
    }
  });
}));

// @route   GET /api/workouts/progress/:exerciseId
// @desc    Get user's progress for a specific exercise
// @access  Private
router.get('/progress/:exerciseId', auth, asyncHandler(async (req, res) => {
  const { exerciseId } = req.params;
  const { limit = 50 } = req.query;
  
  const progress = await WorkoutLog.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(req.user._id),
        'exercises.exercise': mongoose.Types.ObjectId(exerciseId)
      }
    },
    {
      $unwind: '$exercises'
    },
    {
      $match: {
        'exercises.exercise': mongoose.Types.ObjectId(exerciseId)
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        sets: { $push: '$exercises.sets' },
        maxWeight: { $max: '$exercises.weight' },
        maxReps: { $max: '$exercises.reps' },
        totalSets: { $sum: 1 },
        workoutId: { $first: '$_id' },
        createdAt: { $first: '$createdAt' }
      }
    },
    {
      $sort: { _id: -1 }
    },
    {
      $limit: parseInt(limit)
    }
  ]);
  
  res.json({
    success: true,
    data: progress
  });
}));

module.exports = router;


