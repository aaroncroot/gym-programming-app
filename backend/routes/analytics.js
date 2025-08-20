const express = require('express');
const router = express.Router();
const { auth, trainerOnly } = require('../middleware/auth');
const User = require('../models/user');
const Program = require('../models/Program');
const WorkoutLog = require('../models/WorkoutLog');
const Goal = require('../models/Goal');
const Progress = require('../models/Progress');

// Trainer overview - remove time calculations
router.get('/trainer', auth, trainerOnly, async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  // Total clients
  const totalClients = await User.countDocuments({
    assignedTrainer: req.user._id,
    role: 'client',
    isApprovedByTrainer: true
  });

  // Workouts completed by all clients
  const logs = await WorkoutLog.find({
    user: { $in: (await User.find({ assignedTrainer: req.user._id, role: 'client' }).distinct('_id')) },
    createdAt: { $gte: since }
  });

  const totalWorkouts = logs.length;
  const avgCompletionRate = Math.round(
    (logs.filter(l => l.completed).length / (logs.length || 1)) * 100
  );

  // Revenue and subscriptions (stubbed, replace with real logic if needed)
  const monthlyRevenue = totalClients * 50; // e.g., $50 per client
  const revenueGrowth = 5; // %
  const activeSubscriptions = totalClients;
  const subscriptionGrowth = 3; // %
  const avgClientValue = 50;
  const clientValueGrowth = 2; // %

  res.json({
    success: true,
    data: {
      totalClients,
      totalWorkouts,
      avgCompletionRate,
      monthlyRevenue,
      revenueGrowth,
      activeSubscriptions,
      subscriptionGrowth,
      avgClientValue,
      clientValueGrowth
    }
  });
});

// Per-client stats - remove time calculations
router.get('/clients', auth, trainerOnly, async (req, res) => {
  const clients = await User.find({
    assignedTrainer: req.user._id,
    role: 'client',
    isApprovedByTrainer: true
  });

  const stats = await Promise.all(clients.map(async (client) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const allLogs = await WorkoutLog.find({ user: client._id });
    const weekLogs = await WorkoutLog.find({ 
      user: client._id, 
      createdAt: { $gte: weekAgo } 
    });
    const monthLogs = await WorkoutLog.find({ 
      user: client._id, 
      createdAt: { $gte: monthAgo } 
    });

    // Calculate completion rates for different periods
    const allTimeCompletion = Math.round(
      (allLogs.filter(l => l.completed).length / (allLogs.length || 1)) * 100
    );
    const weekCompletion = Math.round(
      (weekLogs.filter(l => l.completed).length / (weekLogs.length || 1)) * 100
    );
    const monthCompletion = Math.round(
      (monthLogs.filter(l => l.completed).length / (monthLogs.length || 1)) * 100
    );

    // Check for 3+ missed workouts in a row
    const recentLogs = allLogs.slice(0, 10).sort((a, b) => b.createdAt - a.createdAt);
    const missedWorkouts = recentLogs.filter(log => !log.completed).length;
    const hasMissedStreak = missedWorkouts >= 3;

    return {
      _id: client._id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      totalWorkouts: allLogs.length,
      completionRate: allTimeCompletion,
      weekCompletion,
      monthCompletion,
      lastWorkout: allLogs.length > 0 ? allLogs[0].createdAt : null,
      hasMissedStreak,
      missedWorkouts
    };
  }));

  res.json({ success: true, data: stats });
});

// Per-program stats
router.get('/programs', auth, trainerOnly, async (req, res) => {
  const programs = await Program.find({ trainer: req.user._id });

  const stats = await Promise.all(programs.map(async (program) => {
    const assigned = await Program.countDocuments({ templateId: program._id });
    const completed = await WorkoutLog.countDocuments({ program: program._id, completed: true });
    const avgRating = await WorkoutLog.aggregate([
      { $match: { program: program._id, rating: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    return {
      _id: program._id,
      name: program.name,
      category: program.category,
      timesAssigned: assigned,
      timesCompleted: completed,
      avgRating: avgRating[0]?.avg ? avgRating[0].avg.toFixed(1) : null
    };
  }));

  res.json({ success: true, data: stats });
});

// Client analytics - remove time calculations
router.get('/client', auth, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const logs = await WorkoutLog.find({ user: req.user._id });
  const totalWorkouts = logs.length;
  const completionRate = Math.round(
    (logs.filter(l => l.completed).length / (logs.length || 1)) * 100
  );
  const lastWorkout = logs.length > 0 ? logs[0].createdAt : null;

  res.json({
    success: true,
    data: {
      totalWorkouts,
      completionRate,
      lastWorkout
    }
  });
});

// Client progress tracking endpoint
router.get('/client/progress', auth, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const progress = await Progress.findOne({ user: req.user._id });
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: {
      progress: progress || {},
      goals: goals || []
    }
  });
});

// Save progress data
router.post('/client/progress', auth, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { oneRepMaxes, measurements, weight } = req.body;
  
  let progress = await Progress.findOne({ user: req.user._id });
  if (!progress) {
    progress = new Progress({ user: req.user._id });
  }

  if (oneRepMaxes) progress.oneRepMaxes = oneRepMaxes;
  if (measurements) progress.measurements = measurements;
  if (weight !== undefined) progress.weight = weight;

  await progress.save();
  
  res.json({ success: true, data: progress });
});

// Save goal
router.post('/client/goals', auth, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { title, description, targetDate, reminderEnabled } = req.body;
  
  const goal = new Goal({
    user: req.user._id,
    title,
    description,
    targetDate,
    reminderEnabled: reminderEnabled || false
  });

  await goal.save();
  
  res.json({ success: true, data: goal });
});

// Get client goals (for trainers)
router.get('/client/:clientId/goals', auth, trainerOnly, async (req, res) => {
  const goals = await Goal.find({ user: req.params.clientId }).sort({ createdAt: -1 });
  res.json({ success: true, data: goals });
});

module.exports = router; 