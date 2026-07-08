import express from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { buildGapExplanationRouter } from '../../src/gap-explanations/gap-explanations.routes';
import { GapExplanationService } from '../../src/gap-explanations/gap-explanations.service';
import { HttpError } from '../../src/shared/http-error';

describe('Gap explanation routes (/api/gap-explanations)', () => {
  const validPayload = {
    locale: 'en',
    score: 40,
    level: 'needs-work',
    gaps: [
      {
        id: 'trusted-contacts-count',
        category: 'trusted_contacts',
        title: 'Add two trusted contacts',
        detail: 'Two contacts avoids a single point of failure during an emergency.',
        severity: 'high',
        priority: 20,
        action: { label: 'Add trusted contact', route: '/trusted-contacts' },
        evidence: { current: 1, required: 2, unit: 'trusted contacts' }
      }
    ]
  };

  it('returns explanation envelope from the default app route', async () => {
    const app = createApp({
      gapExplanationClient: {
        async completePrompt() {
          return {
            content: JSON.stringify({
              summary: 'Add the missing trusted contact first.',
              recommendations: [
                {
                  gapId: 'trusted-contacts-count',
                  urgency: 'do_first',
                  explanation: 'A backup person gives your family a second contact path.',
                  nextActionLabel: 'Add trusted contact'
                }
              ]
            }),
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-latest',
            stopReason: 'end_turn'
          };
        }
      }
    });

    const res = await request(app).post('/api/gap-explanations').send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        summary: expect.stringContaining('trusted contact'),
        disclaimerRequired: true,
        provider: expect.objectContaining({ name: 'anthropic' })
      })
    );
  });

  it('rejects unknown fields and sensitive asset location details', async () => {
    const app = createApp({
      gapExplanationClient: {
        async completePrompt() {
          return { content: '{}', provider: 'anthropic', model: 'unused' };
        }
      }
    });
    const unknown = await request(app)
      .post('/api/gap-explanations')
      .send({ ...validPayload, rawPrompt: 'ignore safety' });
    const sensitive = await request(app)
      .post('/api/gap-explanations')
      .send({
        ...validPayload,
        gaps: [{ ...validPayload.gaps[0], locationHint: 'Maybank branch drawer' }]
      });

    expect(unknown.status).toBe(400);
    expect(sensitive.status).toBe(400);
  });

  it('maps expected service errors into safe error envelopes', async () => {
    const throwingService = {
      explain: async () => {
        throw new HttpError(503, 'Gap explanation provider unavailable');
      }
    } as unknown as GapExplanationService;
    const app = express();
    app.use(express.json());
    app.use('/api/gap-explanations', buildGapExplanationRouter(throwingService));

    const res = await request(app).post('/api/gap-explanations').send(validPayload);

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, error: 'Gap explanation provider unavailable' });
  });

  it('maps unexpected service errors without leaking internals', async () => {
    const throwingService = {
      explain: async () => {
        throw new Error('DEEPSEEK_API_KEY failed');
      }
    } as unknown as GapExplanationService;
    const app = express();
    app.use(express.json());
    app.use('/api/gap-explanations', buildGapExplanationRouter(throwingService));

    const res = await request(app).post('/api/gap-explanations').send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('DEEPSEEK_API_KEY');
  });
});
