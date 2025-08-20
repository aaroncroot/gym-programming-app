const request = require('supertest');
const app = require('../server');

describe('Performance Tests', () => {
  describe('Concurrent User Load', () => {
    it('should handle 100 concurrent login requests', async () => {
      const loginRequests = Array(100).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(loginRequests);
      const endTime = Date.now();

      const successfulRequests = responses.filter(r => r.status === 200).length;
      const averageResponseTime = (endTime - startTime) / responses.length;

      console.log(`Successful requests: ${successfulRequests}/100`);
      console.log(`Average response time: ${averageResponseTime}ms`);

      expect(successfulRequests).toBeGreaterThan(80); // 80% success rate
      expect(averageResponseTime).toBeLessThan(1000); // Under 1 second
    });
  });

  describe('Database Query Performance', () => {
    it('should fetch user analytics within 500ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/analytics/client')
        .set('Authorization', 'Bearer <test-token>');

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
    });
  });
}); 