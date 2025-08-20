const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    type: Number,
    default: null
  },
  oneRepMaxes: {
    type: Map,
    of: Number,
    default: {}
  },
  measurements: {
    chest: { type: Number, default: null },
    waist: { type: Number, default: null },
    hips: { type: Number, default: null },
    biceps: { type: Number, default: null },
    thighs: { type: Number, default: null },
    calves: { type: Number, default: null },
    shoulders: { type: Number, default: null },
    neck: { type: Number, default: null }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

progressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Progress', progressSchema); 