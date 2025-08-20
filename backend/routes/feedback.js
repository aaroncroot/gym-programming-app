const express = require('express');
const router = express.Router();
const { auth, trainerOnly } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Workout = require('../models/Workout');

// Submit workout feedback
router.post('/', auth, async (req, res) => {
  try {
    const { workoutId, feedback, rating } = req.body;
    
    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Feedback is required' });
    }

    // Get the workout to find the trainer
    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    // Create feedback
    const newFeedback = new Feedback({
      client: req.user._id,
      trainer: workout.trainer,
      workoutId,
      feedback: feedback.trim(),
      rating: rating || null
    });

    await newFeedback.save();

    res.json({ success: true, data: newFeedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Error submitting feedback' });
  }
});

// Get unread feedback count for trainer
router.get('/unread-count', auth, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const count = await Feedback.countDocuments({
      trainer: req.user._id,
      read: false
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting unread feedback count:', error);
    res.status(500).json({ success: false, message: 'Error getting unread feedback count' });
  }
});

// Get all feedback for trainer
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const feedback = await Feedback.find({ trainer: req.user._id })
      .populate('client', 'firstName lastName email')
      .populate('workoutId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ success: false, message: 'Error getting feedback' });
  }
});

// Mark feedback as read
router.put('/:feedbackId/read', auth, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Feedback.findByIdAndUpdate(req.params.feedbackId, { read: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking feedback as read:', error);
    res.status(500).json({ success: false, message: 'Error marking feedback as read' });
  }
});

module.exports = router; 