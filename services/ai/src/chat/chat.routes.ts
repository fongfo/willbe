import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { ZodError } from 'zod';
import { HttpError } from '../shared/http-error';
import { seedKnowledgeEntries } from '../knowledge/knowledge.seed';
import { InMemoryKnowledgeRepository } from '../knowledge/knowledge.repository';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { chatReplySchema } from './chat.schema';
import { ChatService } from './chat.service';
import { ClaudeClient, createClaudeClientFromEnv } from './claude.client';

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

export function buildChatRouter(service: ChatService): Router {
  const router = Router();

  router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  }));

  router.post('/', async (req: Request, res: Response) => {
    const parsed = chatReplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      res.status(200).json({ success: true, data: await service.reply(parsed.data) });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  return router;
}

export function createChatRouter(claudeClient: ClaudeClient = createClaudeClientFromEnv()): Router {
  return buildChatRouter(
    new ChatService(
      new KnowledgeService(new InMemoryKnowledgeRepository(seedKnowledgeEntries)),
      claudeClient
    )
  );
}
