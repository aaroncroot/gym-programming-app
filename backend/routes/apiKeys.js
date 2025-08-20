const express = require('express');
const router = express.Router();
const { auth, trainerOnly } = require('../middleware/auth');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const ApiKey = require('../models/ApiKey');
const SecurityAuditService = require('../services/securityAuditService');
const { logger } = require('../middleware/logging');

// Create new API key (trainers only)
router.post('/create', auth, trainerOnly, async (req, res) => {
  try {
    const { name, permissions, allowedEndpoints, ipWhitelist, expiresAt, rateLimit } = req.body;

    // Generate new API key
    const apiKey = new ApiKey({
      name: name || `API Key ${Date.now()}`,
      key: ApiKey.generateKey(),
      owner: req.user._id,
      permissions: permissions || ['read'],
      allowedEndpoints: allowedEndpoints || [],
      ipWhitelist: ipWhitelist || [],
      expiresAt: expiresAt || null,
      rateLimit: rateLimit || { requests: 1000, window: 3600000 }
    });

    await apiKey.save();

    // Log security audit event
    await SecurityAuditService.logEvent({
      event: 'api_key_created',
      severity: 'low',
      user: req.user._id,
      ip: req.ip,
      endpoint: req.originalUrl,
      details: {
        apiKeyId: apiKey._id,
        apiKeyName: apiKey.name,
        permissions: apiKey.permissions
      }
    });

    logger.info('API key created', {
      userId: req.user._id,
      apiKeyId: apiKey._id,
      apiKeyName: apiKey.name
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key, // Only show key once
        permissions: apiKey.permissions,
        allowedEndpoints: apiKey.allowedEndpoints,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    logger.error('Failed to create API key', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// List user's API keys
router.get('/my-keys', auth, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ owner: req.user._id })
      .select('-key') // Don't send the actual key
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    logger.error('Failed to fetch API keys', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys'
    });
  }
});

// Revoke API key
router.delete('/revoke/:id', auth, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    apiKey.isActive = false;
    await apiKey.save();

    // Log security audit event
    await SecurityAuditService.logEvent({
      event: 'api_key_revoked',
      severity: 'medium',
      user: req.user._id,
      ip: req.ip,
      endpoint: req.originalUrl,
      details: {
        apiKeyId: apiKey._id,
        apiKeyName: apiKey.name
      }
    });

    logger.info('API key revoked', {
      userId: req.user._id,
      apiKeyId: apiKey._id
    });

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    logger.error('Failed to revoke API key', {
      error: error.message,
      userId: req.user._id,
      apiKeyId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key'
    });
  }
});

// Test API key endpoint (protected by API key)
router.get('/test', apiKeyAuth('read'), (req, res) => {
  res.json({
    success: true,
    message: 'API key authentication successful',
    data: {
      apiKeyId: req.apiKey.id,
      apiKeyName: req.apiKey.name,
      permissions: req.apiKey.permissions,
      timestamp: new Date().toISOString()
    }
  });
});

// Get API key usage statistics
router.get('/stats/:id', auth, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Get recent usage from security audit
    const recentUsage = await SecurityAuditService.getSecurityReport('24h');

    res.json({
      success: true,
      data: {
        apiKey: {
          id: apiKey._id,
          name: apiKey.name,
          isActive: apiKey.isActive,
          lastUsed: apiKey.lastUsed,
          expiresAt: apiKey.expiresAt,
          permissions: apiKey.permissions
        },
        usage: recentUsage
      }
    });
  } catch (error) {
    logger.error('Failed to fetch API key stats', {
      error: error.message,
      userId: req.user._id,
      apiKeyId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch API key statistics'
    });
  }
});

module.exports = router;
