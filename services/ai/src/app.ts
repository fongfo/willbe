import express, { Express } from 'express';
import { LlmClient, PromptLlmClient, createPromptLlmClientFromEnv } from './chat/llm.client';
import { createChatRouter } from './chat/chat.routes';
import { createGapExplanationRouter } from './gap-explanations/gap-explanations.routes';
import { knowledgeRouter } from './knowledge/knowledge.routes';
import { healthRouter } from './routes/health';

export interface AppOptions {
  readonly claudeClient?: LlmClient;
  readonly llmClient?: LlmClient;
  readonly gapExplanationClient?: PromptLlmClient;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use('/health', healthRouter);
  app.use('/api/chat', createChatRouter(options.llmClient ?? options.claudeClient));
  app.use(
    '/api/gap-explanations',
    createGapExplanationRouter(options.gapExplanationClient ?? createPromptLlmClientFromEnv())
  );
  app.use('/api/knowledge', knowledgeRouter);

  return app;
}
