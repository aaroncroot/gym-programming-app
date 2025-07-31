const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'sports']
  },
  muscleGroup: {
    type: String,
    required: true,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full-body', 'cardio']
  },
  equipment: {
    type: String,
    default: 'bodyweight',
    enum: ['bodyweight', 'dumbbells', 'barbell', 'machine', 'cable', 'kettlebell', 'resistance-band', 'cardio-machine', 'medicine-ball', 'stability-ball', 'trx', 'bosu-trainer', 'heavy-ropes', 'pull-up-bar', 'raised-platform-box']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  instructions: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  videoFile: {
    type: String, // Store file path or cloud URL
    default: ''
  },
  isVideoPrivate: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
