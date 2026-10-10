const request = require('supertest');
const app = require('../../src/app');

/**
 * DB-free HTTP contract tests: these exercise middleware wiring, validation and the
 * central error formatter without requiring a running MongoDB instance.
 */
describe('HTTP layer', () => {
  it('exposes a health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('returns the API discovery document', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.data.modules.students).toBe('/api/v1/students');
  });

  it('404s unknown routes through the central error handler', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
    );
  });

  it('rejects an OTP request with an invalid phone (422 + field details)', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({ phone: '123' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toHaveProperty('field', 'phone');
  });

  it('blocks protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('blocks protected routes with a malformed token', async () => {
    const res = await request(app).get('/api/v1/students/dashboard').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('validates the password login payload before touching the database', async () => {
    const res = await request(app).post('/api/v1/auth/password/login').send({ phone: '9876543210' });
    expect(res.status).toBe(422);
    expect(res.body.error.details.map((d) => d.field)).toContain('password');
  });
});
