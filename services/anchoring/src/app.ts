import express, { Express } from 'express';
import { anchorRouter } from './anchors/anchor.routes';
import { healthRouter } from './routes/health';
import { walletRouter } from './wallets/wallet.routes';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use('/health', healthRouter);
  app.use('/api/anchors', anchorRouter);
  app.use('/api/wallets', walletRouter);

  return app;
}
