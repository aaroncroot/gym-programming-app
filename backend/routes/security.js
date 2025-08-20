const express = require('express');
const router = express.Router();
const { auth, trainerOnly } = require('../middleware/auth');
const SecurityAuditService = require('../services/securityAuditService');
const SecurityAudit = require('../models/SecurityAudit');
const { logger } = require('../middleware/logging');

// Get security overview (trainers only)
router.get('/overview', auth, trainerOnly, async (req, res) => {
  try {
    const [recentEvents, riskSummary, topIPs] = await Promise.all([
      SecurityAuditService.getSecurityReport('24h'),
      SecurityAudit.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, avgRisk: { $avg: '$riskScore' }, maxRisk: { $max: '$riskScore' } } }
      ]),
      SecurityAudit.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: { _id: '$ip', count: { $sum: 1 }, avgRisk: { $avg: '$riskScore' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        recentEvents,
        riskMetrics: riskSummary[0] || { avgRisk: 0, maxRisk: 0 },
        topIPs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to fetch security overview', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch security overview'
    });
  }
});

// Get security events with filtering
router.get('/events', auth, trainerOnly, async (req, res) => {
  try {
    const { 
      severity, 
      event, 
      ip, 
      user, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const filter = {};
    
    if (severity) filter.severity = severity;
    if (event) filter.event = event;
    if (ip) filter.ip = { $regex: ip, $options: 'i' };
    if (user) filter.user = user;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      SecurityAudit.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('apiKey', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SecurityAudit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch security events', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch security events'
    });
  }
});

// Resolve security event
router.patch('/events/:id/resolve', auth, trainerOnly, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const event = await SecurityAudit.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Security event not found'
      });
    }

    event.isResolved = true;
    event.resolvedBy = req.user._id;
    event.resolvedAt = new Date();
    event.notes = notes || '';

    await event.save();

    logger.info('Security event resolved', {
      userId: req.user._id,
      eventId: event._id,
      eventType: event.event
    });

    res.json({
      success: true,
      message: 'Security event resolved successfully',
      data: event
    });
  } catch (error) {
    logger.error('Failed to resolve security event', {
      error: error.message,
      userId: req.user._id,
      eventId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to resolve security event'
    });
  }
});

// Get security metrics
router.get('/metrics', auth, trainerOnly, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    const metrics = await SecurityAuditService.getSecurityReport(timeframe);
    
    // Get additional metrics
    const [totalUsers, activeUsers] = await Promise.all([
      require('../models/user').countDocuments(),
      require('../models/user').countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        securityMetrics: metrics,
        userMetrics: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to fetch security metrics', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch security metrics'
    });
  }
});

module.exports = router;


