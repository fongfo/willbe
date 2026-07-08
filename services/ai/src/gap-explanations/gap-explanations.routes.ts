import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { ZodError } from 'zod';
import { PromptLlmClient, createPromptLlmClientFromEnv } from '../chat/llm.client';
import { HttpError } from '../shared/http-error';
import { explainGapsSchema } from './gap-explanations.schema';
import { GapExplanationService } from './gap-explanations.service';

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

export function buildGapExplanationRouter(service: GapExplanationService): Router {
  const router = Router();

  router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  }));

  router.post('/', async (req: Request, res: Response) => {
    const parsed = explainGapsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      res.status(200).json({ success: true, data: await service.explain(parsed.data) });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  return router;
}

export function createGapExplanationRouter(
  llmClient: PromptLlmClient = createPromptLlmClientFromEnv()
): Router {
  return buildGapExplanationRouter(new GapExplanationService(llmClient));
}
