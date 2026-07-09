import express, { Express } from 'express';
import { healthRouter } from './routes/health';
import { familyMemberRouter } from './family-members/family-member.routes';
import { trustedContactRouter } from './trusted-contacts/trusted-contact.routes';
import { assetReferenceRouter } from './asset-references/asset-reference.routes';
import { reviewSettingRouter } from './review-settings/review-setting.routes';
import { readinessRouter } from './readiness/readiness.routes';
import { handoverRouter } from './handover/handover.routes';
import { authRouter } from './auth/auth.routes';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use('/health', healthRouter);
  app.use('/api/family-members', familyMemberRouter);
  app.use('/api/trusted-contacts', trustedContactRouter);
  app.use('/api/asset-references', assetReferenceRouter);
  app.use('/api/review-settings', reviewSettingRouter);
  app.use('/api/readiness', readinessRouter);
  app.use('/api/handover', handoverRouter);
  app.use('/api/auth', authRouter);

  return app;
}
