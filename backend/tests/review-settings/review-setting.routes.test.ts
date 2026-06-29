import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Review Setting routes (/api/review-settings)', () => {
  beforeEach(async () => {
    await prisma.reviewSetting.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/review-settings', () => {
    it('returns 200 with default settings when none have been saved', async () => {
      const app = createApp();

      const res = await request(app).get('/api/review-settings');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkInFrequency).toBe('EVERY_6_MONTHS');
      expect(res.body.data.connectedProviders).toEqual([]);
    });
  });

  describe('PUT /api/review-settings', () => {
    it('creates the singleton on first save and returns 200 with the record', async () => {
      const app = createApp();

      const res = await request(app).put('/api/review-settings').send({
        checkInFrequency: 'EVERY_3_MONTHS',
        connectedProviders: ['GOOGLE_DRIVE', 'ONEDRIVE']
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkInFrequency).toBe('EVERY_3_MONTHS');
      expect(res.body.data.connectedProviders).toEqual(['GOOGLE_DRIVE', 'ONEDRIVE']);
      expect(typeof res.body.data.id).toBe('string');
    });

    it('replaces the existing singleton instead of creating a second row', async () => {
      const app = createApp();

      await request(app)
        .put('/api/review-settings')
        .send({ checkInFrequency: 'EVERY_3_MONTHS', connectedProviders: ['GOOGLE_DRIVE'] });

      const second = await request(app)
        .put('/api/review-settings')
        .send({ checkInFrequency: 'CUSTOM_ANNUAL', connectedProviders: [] });

      const after = await request(app).get('/api/review-settings');
      const count = await prisma.reviewSetting.count();

      expect(second.status).toBe(200);
      expect(after.body.data.checkInFrequency).toBe('CUSTOM_ANNUAL');
      expect(after.body.data.connectedProviders).toEqual([]);
      expect(count).toBe(1);
    });

    it('returns 400 when the frequency is invalid', async () => {
      const app = createApp();

      const res = await request(app)
        .put('/api/review-settings')
        .send({ checkInFrequency: 'WEEKLY', connectedProviders: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // A request that smuggles a credential field must be rejected at the boundary.
    it('returns 400 when the body contains an unexpected field', async () => {
      const app = createApp();

      const res = await request(app).put('/api/review-settings').send({
        checkInFrequency: 'EVERY_6_MONTHS',
        connectedProviders: ['GOOGLE_DRIVE'],
        accessToken: 'super-secret'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
