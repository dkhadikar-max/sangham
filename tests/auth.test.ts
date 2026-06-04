import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/config/database';

describe('Auth routes', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/auth/register', () => {
    it('returns 400 if neither email nor phone provided', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ password: 'test1234', displayName: 'Test User' });
      expect(res.status).toBe(400);
    });
    it('returns 400 for password shorter than 8 chars', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@test.com', password: 'short', displayName: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 401 for non-existent user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@nobody.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
