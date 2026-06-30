import request from 'supertest';
import { createApp } from '../../src/app';

describe('Wallet routes (/api/wallets)', () => {
  const app = createApp();

  it('creates a custodial wallet on first POST (201) and never returns key material', async () => {
    const res = await request(app).post('/api/wallets').send({ ownerRef: 'routes-create' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ownerRef).toBe('routes-create');
    expect(res.body.data.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(res.body.data).not.toHaveProperty('keyReference');
    expect(JSON.stringify(res.body)).not.toContain('mock-key');
  });

  it('is idempotent — a repeat POST returns 200 with the same wallet', async () => {
    const first = await request(app).post('/api/wallets').send({ ownerRef: 'routes-idem' });
    const second = await request(app).post('/api/wallets').send({ ownerRef: 'routes-idem' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(second.body.data.address).toBe(first.body.data.address);
  });

  it('rejects a missing ownerRef with 400', async () => {
    const res = await request(app).post('/api/wallets').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects unknown fields with 400 (strict schema)', async () => {
    const res = await request(app)
      .post('/api/wallets')
      .send({ ownerRef: 'x', privateKey: 'should-not-be-accepted' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET returns the wallet after creation and 404 when none exists', async () => {
    await request(app).post('/api/wallets').send({ ownerRef: 'routes-get' });

    const found = await request(app).get('/api/wallets/routes-get');
    expect(found.status).toBe(200);
    expect(found.body.data.ownerRef).toBe('routes-get');
    expect(found.body.data).not.toHaveProperty('keyReference');

    const missing = await request(app).get('/api/wallets/never-created');
    expect(missing.status).toBe(404);
    expect(missing.body.success).toBe(false);
  });
});
