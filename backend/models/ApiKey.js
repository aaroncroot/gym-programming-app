const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'admin'],
    default: ['read']
  }],
  allowedEndpoints: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  ipWhitelist: [{
    type: String,
    trim: true
  }],
  rateLimit: {
    requests: {
      type: Number,
      default: 1000
    },
    window: {
      type: Number,
      default: 3600000 // 1 hour in milliseconds
    }
  }
}, {
  timestamps: true
});

// Generate a new API key
apiKeySchema.statics.generateKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if API key is expired
apiKeySchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Check if API key has permission for endpoint
apiKeySchema.methods.hasPermission = function(endpoint, permission = 'read') {
  if (!this.isActive) return false;
  if (this.isExpired()) return false;
  
  // Check if endpoint is allowed
  if (this.allowedEndpoints.length > 0 && !this.allowedEndpoints.includes(endpoint)) {
    return false;
  }
  
  // Check if permission is granted
  return this.permissions.includes(permission);
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
