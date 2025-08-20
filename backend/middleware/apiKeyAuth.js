const ApiKey = require('../models/ApiKey');
const { logger } = require('./logging');

const apiKeyAuth = (requiredPermission = 'read') => {
  return async (req, res, next) => {
    try {
      const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key required'
        });
      }

      // Find and validate API key
      const keyDoc = await ApiKey.findOne({ key: apiKey, isActive: true });
      
      if (!keyDoc) {
        logger.warn('Invalid API key attempt', {
          apiKey: apiKey.substring(0, 8) + '...',
          ip: req.ip,
          endpoint: req.originalUrl
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }

      // Check if key is expired
      if (keyDoc.isExpired()) {
        logger.warn('Expired API key attempt', {
          apiKeyId: keyDoc._id,
          ip: req.ip,
          endpoint: req.originalUrl
        });
        
        return res.status(401).json({
          success: false,
          message: 'API key expired'
        });
      }

      // Check IP whitelist if configured
      if (keyDoc.ipWhitelist.length > 0 && !keyDoc.ipWhitelist.includes(req.ip)) {
        logger.warn('API key IP restriction violation', {
          apiKeyId: keyDoc._id,
          ip: req.ip,
          allowedIPs: keyDoc.ipWhitelist,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json({
          success: false,
          message: 'IP address not allowed'
        });
      }

      // Check permissions
      if (!keyDoc.hasPermission(req.originalUrl, requiredPermission)) {
        logger.warn('API key permission denied', {
          apiKeyId: keyDoc._id,
          ip: req.ip,
          endpoint: req.originalUrl,
          requiredPermission,
          grantedPermissions: keyDoc.permissions
        });
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Update last used timestamp
      keyDoc.lastUsed = new Date();
      await keyDoc.save();

      // Add API key info to request
      req.apiKey = {
        id: keyDoc._id,
        name: keyDoc.name,
        owner: keyDoc.owner,
        permissions: keyDoc.permissions
      };

      next();
    } catch (error) {
      logger.error('API key authentication error', {
        error: error.message,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
};

module.exports = { apiKeyAuth };
