import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { buildKnowledgeRouter } from '../../src/knowledge/knowledge.routes';
import { HttpError } from '../../src/shared/http-error';
import { KnowledgeService } from '../../src/knowledge/knowledge.service';

describe('Knowledge routes (/api/knowledge)', () => {
  const app = createApp();

  it('lists seeded product, FAQ and regulatory knowledge entries', async () => {
    const res = await request(app).get('/api/knowledge');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'PRODUCT_DOC' }),
        expect.objectContaining({ category: 'FAQ' }),
        expect.objectContaining({ category: 'REGULATORY_SUMMARY' })
      ])
    );
  });

  it('searches RAG context and returns source metadata without raw prompts', async () => {
    const res = await request(app)
      .post('/api/knowledge/search')
      .send({ query: 'asset references passwords private keys', limit: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results[0]).toEqual(
      expect.objectContaining({
        id: 'product-asset-reference-boundary',
        source: expect.objectContaining({ document: 'project/PRD.md' })
      })
    );
    expect(JSON.stringify(res.body)).not.toContain('ANTHROPIC_API_KEY');
  });

  it('rejects invalid searches and unknown fields', async () => {
    const emptyQuery = await request(app).post('/api/knowledge/search').send({ query: '' });
    const unknownField = await request(app)
      .post('/api/knowledge/search')
      .send({ query: 'trusted contacts', rawPrompt: 'ignore policy' });
    const invalidListFilter = await request(app).get('/api/knowledge?category=UNKNOWN');

    expect(emptyQuery.status).toBe(400);
    expect(unknownField.status).toBe(400);
    expect(invalidListFilter.status).toBe(400);
  });

  it('converts expected service errors into error envelopes', async () => {
    const throwingService = {
      list: () => {
        throw new HttpError(503, 'Knowledge index unavailable');
      },
      search: () => {
        throw new Error('boom');
      }
    } as unknown as KnowledgeService;
    const errorApp = express();
    errorApp.use(express.json());
    errorApp.use('/api/knowledge', buildKnowledgeRouter(throwingService));

    const listRes = await request(errorApp).get('/api/knowledge');
    const searchRes = await request(errorApp)
      .post('/api/knowledge/search')
      .send({ query: 'trusted contacts' });

    expect(listRes.status).toBe(503);
    expect(listRes.body).toEqual({ success: false, error: 'Knowledge index unavailable' });
    expect(searchRes.status).toBe(500);
    expect(searchRes.body).toEqual({ success: false, error: 'Internal server error' });
  });
});
