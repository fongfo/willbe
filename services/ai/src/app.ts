import express, { Express } from 'express';
import { LlmClient } from './chat/llm.client';
import { createChatRouter } from './chat/chat.routes';
import { knowledgeRouter } from './knowledge/knowledge.routes';
import { healthRouter } from './routes/health';

export interface AppOptions {
  readonly claudeClient?: LlmClient;
  readonly llmClient?: LlmClient;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use('/health', healthRouter);
  app.use('/api/chat', createChatRouter(options.llmClient ?? options.claudeClient));
  app.use('/api/knowledge', knowledgeRouter);

  return app;
}
