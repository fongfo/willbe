import express, { Express } from 'express';
import { healthRouter } from './routes/health';
import { familyMemberRouter } from './family-members/family-member.routes';
import { trustedContactRouter } from './trusted-contacts/trusted-contact.routes';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use('/health', healthRouter);
  app.use('/api/family-members', familyMemberRouter);
  app.use('/api/trusted-contacts', trustedContactRouter);

  return app;
}
