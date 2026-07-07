import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { ZodError } from 'zod';
import { HttpError } from '../shared/http-error';
import { seedKnowledgeEntries } from './knowledge.seed';
import { InMemoryKnowledgeRepository } from './knowledge.repository';
import { KnowledgeService } from './knowledge.service';
import { listKnowledgeQuerySchema, searchKnowledgeSchema } from './knowledge.schema';

function firstIssueMessage(error: ZodError): string {
  const [issue] = error.issues;
  return issue ? issue.message : 'Invalid request';
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

export function buildKnowledgeRouter(service: KnowledgeService): Router {
  const router = Router();

  router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  }));

  router.get('/', (req: Request, res: Response) => {
    const parsed = listKnowledgeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      res.status(200).json({ success: true, data: { entries: service.list(parsed.data) } });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  router.post('/search', (req: Request, res: Response) => {
    const parsed = searchKnowledgeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      res.status(200).json({ success: true, data: service.search(parsed.data) });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  return router;
}

export const knowledgeRouter = buildKnowledgeRouter(
  new KnowledgeService(new InMemoryKnowledgeRepository(seedKnowledgeEntries))
);
