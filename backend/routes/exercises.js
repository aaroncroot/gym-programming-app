const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Exercise = require('../models/Exercise');
const { auth, trainerOnly } = require('../middleware/auth');

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get exercises based on user role and access
router.get('/', auth, asyncHandler(async (req, res) => {
  let query = {};
  
  if (req.user.role === 'trainer') {
    // Trainers see their own exercises + public exercises
    query = {
      $or: [
        { createdBy: req.user._id },
        { isPublic: true }
      ]
    };
  } else if (req.user.role === 'client') {
    // Clients see public exercises + their trainer's private exercises
    query = {
      $or: [
        { isPublic: true },
        { 
          $and: [
            { isPrivate: true },
            { trainerId: req.user.trainerId }
          ]
        }
      ]
    };
  }

  const exercises = await Exercise.find(query).populate('createdBy', 'username');
  
  res.json({
    success: true,
    count: exercises.length,
    data: exercises
  });
}));

// Create exercise (trainers only)
router.post('/', [
  auth,
  trainerOnly,
  body('name').trim().isLength({ min: 1 }).withMessage('Exercise name is required'),
  body('category').isIn(['strength', 'cardio', 'flexibility', 'balance', 'sports']).withMessage('Invalid category'),
  body('muscleGroup').isIn(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full-body', 'cardio']).withMessage('Invalid muscle group'),
  body('equipment').optional().isIn(['bodyweight', 'dumbbells', 'barbell', 'machine', 'cable', 'kettlebell', 'resistance-band', 'cardio-machine', 'medicine-ball', 'stability-ball', 'trx', 'bosu-trainer', 'heavy-ropes', 'pull-up-bar', 'raised-platform-box']).withMessage('Invalid equipment'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('instructions').trim().isLength({ min: 1 }).withMessage('Instructions are required'),
  body('videoUrl').optional().isURL().withMessage('Invalid video URL'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
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
    category, 
    muscleGroup, 
    equipment, 
    difficulty, 
    instructions, 
    videoUrl, 
    isPublic, 
    isPrivate 
  } = req.body;
  
  const exercise = new Exercise({
    name,
    category,
    muscleGroup,
    equipment: equipment || 'bodyweight',
    difficulty,
    instructions,
    videoUrl: videoUrl || '',
    isPublic: isPublic !== undefined ? isPublic : true,
    isPrivate: isPrivate || false,
    createdBy: req.user._id,
    trainerId: req.user._id
  });

  await exercise.save();
  
  const populatedExercise = await Exercise.findById(exercise._id)
    .populate('createdBy', 'username');
  
  res.status(201).json({
    success: true,
    message: 'Exercise created successfully',
    data: populatedExercise
  });
}));

// Update exercise (only creator can update)
router.put('/:id', [
  auth,
  trainerOnly,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Exercise name cannot be empty'),
  body('category').optional().isIn(['strength', 'cardio', 'flexibility', 'balance', 'sports']).withMessage('Invalid category'),
  body('muscleGroup').optional().isIn(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full-body', 'cardio']).withMessage('Invalid muscle group'),
  body('equipment').optional().isIn(['bodyweight', 'dumbbells', 'barbell', 'machine', 'cable', 'kettlebell', 'resistance-band', 'cardio-machine', 'medicine-ball', 'stability-ball', 'trx', 'bosu-trainer', 'heavy-ropes', 'pull-up-bar', 'raised-platform-box']).withMessage('Invalid equipment'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('instructions').optional().trim().isLength({ min: 1 }).withMessage('Instructions cannot be empty'),
  body('videoUrl').optional().isURL().withMessage('Invalid video URL')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: errors.array() 
    });
  }

  const exercise = await Exercise.findById(req.params.id);
  
  if (!exercise) {
    return res.status(404).json({ 
      success: false,
      message: 'Exercise not found' 
    });
  }
  
  // Check if user is authorized to update this exercise
  if (exercise.createdBy && exercise.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to update this exercise' 
    });
  }

  const updatedExercise = await Exercise.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'username');

  res.json({
    success: true,
    message: 'Exercise updated successfully',
    data: updatedExercise
  });
}));

// Delete exercise (only creator can delete)
router.delete('/:id', auth, trainerOnly, asyncHandler(async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  
  if (!exercise) {
    return res.status(404).json({ 
      success: false,
      message: 'Exercise not found' 
    });
  }
  
  // Check if user is authorized to delete this exercise
  if (exercise.createdBy && exercise.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized to delete this exercise' 
    });
  }

  await Exercise.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Exercise deleted successfully'
  });
}));

// Get exercise by ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const exercise = await Exercise.findById(req.params.id)
    .populate('createdBy', 'username');
  
  if (!exercise) {
    return res.status(404).json({ 
      success: false,
      message: 'Exercise not found' 
    });
  }
  
  // Check access permissions
  if (req.user.role === 'client') {
    if (!exercise.isPublic && exercise.trainerId?.toString() !== req.user.trainerId?.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }
  }
  
  res.json({
    success: true,
    data: exercise
  });
}));

module.exports = router;


