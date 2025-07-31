const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed from true to false
  },
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: {
      type: Number,
      required: true,
      default: 3
    },
    reps: {
      type: Number,
      required: true,
      default: 10
    },
    weight: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number, // in seconds, for cardio exercises
      default: 0
    },
    restTime: {
      type: Number, // in seconds
      default: 60
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  frequency: {
    type: String,
    required: true,
    enum: ['daily', '3x-week', '4x-week', '5x-week', 'weekly']
  },
  duration: {
    type: Number, // in weeks
    required: true,
    default: 4
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Workout', workoutSchema);


