import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/config/database';

describe('Library routes', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  describe('GET /api/v1/library/daily-verse', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/v1/library/daily-verse');
      expect([200, 200]).toContain(res.status);
    });
  });

  describe('GET /api/v1/library/search', () => {
    it('accepts search params without auth', async () => {
      const res = await request(app).get('/api/v1/library/search?q=dhamma&limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/v1/library/collections', () => {
    it('returns collection list', async () => {
      const res = await request(app).get('/api/v1/library/collections');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
