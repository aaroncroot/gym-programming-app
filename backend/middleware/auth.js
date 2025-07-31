const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to restrict access to trainers only
const trainerOnly = (req, res, next) => {
  if (req.user.role !== 'trainer') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Trainer role required.' 
    });
  }
  next();
};

// Middleware to restrict access to clients only
const clientOnly = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Client role required.' 
    });
  }
  next();
};

// Middleware to check if user can access a specific resource
const canAccessResource = (resourceField = 'trainer') => {
  return (req, res, next) => {
    const resource = req.resource || req.body;
    const resourceOwnerId = resource[resourceField];
    
    if (!resourceOwnerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Resource owner not specified' 
      });
    }
    
    if (req.user.role === 'trainer' && resourceOwnerId.toString() === req.user._id.toString()) {
      return next();
    }
    
    if (req.user.role === 'client' && resource.client?.toString() === req.user._id.toString()) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to access this resource.' 
    });
  };
};

module.exports = { auth, trainerOnly, clientOnly, canAccessResource };
