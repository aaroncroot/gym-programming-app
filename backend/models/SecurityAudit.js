const mongoose = require('mongoose');

const securityAuditSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'login_attempt',
      'login_success',
      'login_failed',
      'logout',
      'password_change',
      'password_reset',
      'account_locked',
      'account_unlocked',
      'api_key_created',
      'api_key_revoked',
      'api_key_used',
      'permission_denied',
      'suspicious_activity',
      'rate_limit_exceeded',
      'file_upload',
      'file_download',
      'data_access',
      'data_modification'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  apiKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: false
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  endpoint: {
    type: String,
    required: false
  },
  method: {
    type: String,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  metadata: {
    country: String,
    city: String,
    timezone: String,
    browser: String,
    os: String,
    device: String
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
securityAuditSchema.index({ event: 1, createdAt: -1 });
securityAuditSchema.index({ user: 1, createdAt: -1 });
securityAuditSchema.index({ ip: 1, createdAt: -1 });
securityAuditSchema.index({ severity: 1, createdAt: -1 });
securityAuditSchema.index({ riskScore: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityAudit', securityAuditSchema);
