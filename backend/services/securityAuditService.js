const SecurityAudit = require('../models/SecurityAudit');
const { logger } = require('../middleware/logging');

class SecurityAuditService {
  static async logEvent(eventData) {
    try {
      const auditEntry = new SecurityAudit({
        ...eventData,
        riskScore: this.calculateRiskScore(eventData)
      });

      await auditEntry.save();

      // Log high-severity events immediately
      if (eventData.severity === 'high' || eventData.severity === 'critical') {
        logger.warn('High-severity security event', {
          event: eventData.event,
          severity: eventData.severity,
          user: eventData.user,
          ip: eventData.ip,
          endpoint: eventData.endpoint,
          riskScore: auditEntry.riskScore
        });
      }

      return auditEntry;
    } catch (error) {
      logger.error('Failed to log security audit event', {
        error: error.message,
        eventData
      });
    }
  }

  static calculateRiskScore(eventData) {
    let score = 0;

    // Base score by event type
    const eventScores = {
      'login_attempt': 5,
      'login_failed': 15,
      'account_locked': 25,
      'permission_denied': 20,
      'suspicious_activity': 30,
      'rate_limit_exceeded': 35,
      'api_key_revoked': 10,
      'password_reset': 15
    };

    score += eventScores[eventData.event] || 0;

    // Increase score for repeated events from same IP
    if (eventData.ip) {
      score += 5;
    }

    // Increase score for high-severity events
    if (eventData.severity === 'high') score += 20;
    if (eventData.severity === 'critical') score += 40;

    return Math.min(score, 100);
  }

  static async getSecurityReport(timeframe = '24h') {
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const events = await SecurityAudit.find({
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    const summary = {
      totalEvents: events.length,
      bySeverity: {
        low: events.filter(e => e.severity === 'low').length,
        medium: events.filter(e => e.severity === 'medium').length,
        high: events.filter(e => e.severity === 'high').length,
        critical: events.filter(e => e.severity === 'critical').length
      },
      byEvent: {},
      topIPs: [],
      topUsers: [],
      averageRiskScore: 0
    };

    // Calculate event type counts
    events.forEach(event => {
      summary.byEvent[event.event] = (summary.byEvent[event.event] || 0) + 1;
    });

    // Calculate average risk score
    if (events.length > 0) {
      summary.averageRiskScore = events.reduce((sum, event) => sum + event.riskScore, 0) / events.length;
    }

    return summary;
  }
}

module.exports = SecurityAuditService;
