const request = require('supertest');
const app = require('../server');

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/trainer')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/analytics/trainer')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent SQL injection in login', async () => {
      const maliciousInput = {
        email: "'; DROP TABLE users; --",
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent clients from accessing trainer endpoints', async () => {
      // Mock client token
      const clientToken = 'client-jwt-token';

      const response = await request(app)
        .get('/api/analytics/trainer')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent users from accessing other users data', async () => {
      // Mock user token
      const userToken = 'user-jwt-token';

      const response = await request(app)
        .get('/api/photos/user/other-user-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should reject oversized file uploads', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', 'Bearer <test-token>')
        .attach('photo', largeFile, 'large-file.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-image file uploads', async () => {
      const textFile = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', 'Bearer <test-token>')
        .attach('photo', textFile, 'text-file.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 