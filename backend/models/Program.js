const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for template programs
  },
  workoutsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 14 // Updated to allow up to 14 workouts per week
  },
  duration: {
    type: Number, // in weeks
    required: true,
    min: 1,
    max: 52
  },
  workouts: [{
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      required: false // Can be null for inline workouts
    },
    week: {
      type: Number,
      required: true,
      min: 1
    },
    day: {
      type: Number,
      required: true,
      min: 1
    },
    notes: {
      type: String,
      default: ''
    },
    isInlineWorkout: {
      type: Boolean,
      default: false
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
        type: Number, // in seconds
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
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
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

// Update the updatedAt field before saving
programSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating end date based on duration
programSchema.virtual('calculatedEndDate').get(function() {
  if (this.startDate && this.duration) {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + (this.duration * 7));
    return endDate;
  }
  return null;
});

// Static method to find programs by trainer
programSchema.statics.findByTrainer = function(trainerId) {
  return this.find({ trainer: trainerId }).populate('workouts.workout').populate('workouts.exercises.exercise');
};

// Static method to find programs by client
programSchema.statics.findByClient = function(clientId) {
  return this.find({ client: clientId, isActive: true }).populate('workouts.workout').populate('workouts.exercises.exercise');
};

// Static method to find template programs
programSchema.statics.findTemplates = function() {
  return this.find({ isTemplate: true }).populate('workouts.workout').populate('workouts.exercises.exercise');
};

// Method to get workouts for a specific week
programSchema.methods.getWorkoutsForWeek = function(weekNumber) {
  return this.workouts.filter(w => w.week === weekNumber);
};

// Method to get workout for a specific day
programSchema.methods.getWorkoutForDay = function(weekNumber, dayNumber) {
  return this.workouts.find(w => w.week === weekNumber && w.day === dayNumber);
};

// Method to assign workout to a specific day
programSchema.methods.assignWorkoutToDay = function(weekNumber, dayNumber, workoutId, notes = '') {
  // Remove existing workout for this day if any
  this.workouts = this.workouts.filter(w => !(w.week === weekNumber && w.day === dayNumber));
  
  // Add new workout assignment
  this.workouts.push({
    workout: workoutId,
    week: weekNumber,
    day: dayNumber,
    notes: notes
  });
  
  return this.save();
};

// Method to assign program to client
programSchema.methods.assignToClient = function(clientId) {
  this.client = clientId;
  this.isTemplate = false;
  this.startDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Program', programSchema); 