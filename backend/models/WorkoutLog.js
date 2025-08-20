const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  workout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    required: false
  },
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: {
      type: Number,
      required: true
    },
    reps: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  completed: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate duration before saving
workoutLogSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

// Static method to get user's workout history
workoutLogSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({ user: userId })
    .populate('program', 'name')
    .populate('workout', 'name')
    .populate('exercises.exercise', 'name category muscleGroup')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get workout statistics
workoutLogSchema.statics.getUserStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalWorkouts: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        averageRating: { $avg: '$rating' },
        completedWorkouts: {
          $sum: { $cond: ['$completed', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get exercise progress
workoutLogSchema.statics.getExerciseProgress = function(userId, exerciseId, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        'exercises.exercise': mongoose.Types.ObjectId(exerciseId),
        createdAt: { $gte: startDate }
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
        maxWeight: { $max: '$exercises.weight' },
        maxReps: { $max: '$exercises.reps' },
        totalSets: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('WorkoutLog', workoutLogSchema); 