import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health route', () => {
  it('reports the AI service as ok', async () => {
    const res = await request(createApp()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'willbe-ai' });
  });
});
