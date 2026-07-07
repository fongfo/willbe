import express, { Express } from 'express';
import { knowledgeRouter } from './knowledge/knowledge.routes';
import { healthRouter } from './routes/health';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use('/health', healthRouter);
  app.use('/api/knowledge', knowledgeRouter);

  return app;
}
