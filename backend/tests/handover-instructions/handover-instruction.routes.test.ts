import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { OTHER_ACCESS_TOKEN, withAuth } from '../support/auth';

describe('Handover Instruction routes (/api/handover-instruction)', () => {
  beforeEach(async () => {
    await prisma.handoverInstruction.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns a default empty instruction before first save', async () => {
    const app = createApp();

    const res = await withAuth(request(app).get('/api/handover-instruction'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ message: null, firstSteps: [] });
  });

  it('creates and returns the owner instruction', async () => {
    const app = createApp();

    const res = await withAuth(request(app).put('/api/handover-instruction')).send({
      message: 'Take a breath, then call Sara.',
      firstSteps: ['Call Sara', 'Open Drive / Family']
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Take a breath, then call Sara.');
    expect(res.body.data.firstSteps).toEqual(['Call Sara', 'Open Drive / Family']);
  });

  it('replaces the singleton instead of creating a second row', async () => {
    const app = createApp();

    await withAuth(request(app).put('/api/handover-instruction')).send({
      message: 'First version',
      firstSteps: ['Step one']
    });
    const second = await withAuth(request(app).put('/api/handover-instruction')).send({
      message: 'Updated version',
      firstSteps: ['Step two']
    });

    const count = await prisma.handoverInstruction.count();

    expect(second.status).toBe(200);
    expect(second.body.data.message).toBe('Updated version');
    expect(second.body.data.firstSteps).toEqual(['Step two']);
    expect(count).toBe(1);
  });

  it('keeps instructions separate per authenticated user', async () => {
    const app = createApp();

    await withAuth(request(app).put('/api/handover-instruction')).send({
      message: 'Owner instruction',
      firstSteps: ['Owner step']
    });
    await withAuth(
      request(app).put('/api/handover-instruction'),
      OTHER_ACCESS_TOKEN
    ).send({
      message: 'Other instruction',
      firstSteps: ['Other step']
    });

    const owner = await withAuth(request(app).get('/api/handover-instruction'));
    const other = await withAuth(
      request(app).get('/api/handover-instruction'),
      OTHER_ACCESS_TOKEN
    );

    expect(owner.body.data.message).toBe('Owner instruction');
    expect(other.body.data.message).toBe('Other instruction');
  });

  it('returns 400 when the body contains an unexpected sensitive field', async () => {
    const app = createApp();

    const res = await withAuth(request(app).put('/api/handover-instruction')).send({
      message: 'Open the folder',
      firstSteps: ['Call Sara'],
      password: 'do-not-store'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
