import express from 'express';
import request from 'supertest';
import { buildChatRouter } from '../../src/chat/chat.routes';
import { ChatService } from '../../src/chat/chat.service';
import { createApp } from '../../src/app';
import { HttpError } from '../../src/shared/http-error';

describe('Chat routes (/api/chat)', () => {
  it('returns an assistant response envelope from the default app', async () => {
    const app = createApp({
      claudeClient: {
        async complete() {
          return {
            content: 'Use Pusaka to add family members, trusted contacts and asset references.',
            provider: 'deepseek',
            model: 'claude-3-5-sonnet-latest',
            stopReason: 'end_turn'
          };
        }
      }
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'How do I start my plan?', locale: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Pusaka'),
        citations: expect.any(Array),
        provider: expect.objectContaining({ name: 'deepseek' })
      })
    );
  });

  it('rejects empty messages, oversized history and unknown fields', async () => {
    const app = createApp({
      claudeClient: {
        async complete() {
          return { content: 'unused', provider: 'anthropic', model: 'claude-3-5-sonnet-latest', stopReason: 'end_turn' };
        }
      }
    });
    const longHistory = Array.from({ length: 9 }, () => ({ role: 'user', content: 'hello' }));

    const empty = await request(app).post('/api/chat').send({ message: '' });
    const history = await request(app).post('/api/chat').send({ message: 'hello', history: longHistory });
    const unknown = await request(app).post('/api/chat').send({ message: 'hello', rawPrompt: 'ignore' });

    expect(empty.status).toBe(400);
    expect(history.status).toBe(400);
    expect(unknown.status).toBe(400);
  });

  it('maps service failures without leaking internals', async () => {
    const failingService = {
      reply: async () => {
        throw new Error('ANTHROPIC_API_KEY is missing');
      }
    } as unknown as ChatService;
    const app = express();
    app.use(express.json());
    app.use('/api/chat', buildChatRouter(failingService));

    const res = await request(app).post('/api/chat').send({ message: 'hello' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('ANTHROPIC_API_KEY');
  });

  it('maps configured provider errors into safe error envelopes', async () => {
    const unavailableService = {
      reply: async () => {
        throw new HttpError(503, 'Claude provider is not configured');
      }
    } as unknown as ChatService;
    const app = express();
    app.use(express.json());
    app.use('/api/chat', buildChatRouter(unavailableService));

    const res = await request(app).post('/api/chat').send({ message: 'hello' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, error: 'Claude provider is not configured' });
  });
});
