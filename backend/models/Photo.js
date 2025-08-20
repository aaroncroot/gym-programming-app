const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photoType: {
    type: String,
    enum: ['before_after', 'workout_session', 'progress'],
    required: true
  },
  category: {
    type: String,
    enum: ['before', 'after', 'workout', 'progress'],
    required: true
  },
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: false
  },
  workoutTitle: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
photoSchema.index({ user: 1, photoType: 1, createdAt: -1 });
photoSchema.index({ trainer: 1, user: 1 });

module.exports = mongoose.model('Photo', photoSchema); 