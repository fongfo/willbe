import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { ZodError } from 'zod';
import { HttpError } from '../shared/http-error';
import { createWalletSchema, ownerRefParamSchema } from './wallet.schema';
import { WalletService } from './wallet.service';
import { InMemoryWalletRepository } from './wallet.repository';
import { MockWalletProvider } from './wallet.provider';

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

// Factory so the router can be wired with any WalletService (a throwing stub in tests,
// the mock-backed default in production), keeping the error paths testable.
export function buildWalletRouter(service: WalletService): Router {
  const router = Router();

  router.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  router.post('/', async (req: Request, res: Response) => {
    const parsed = createWalletSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      const result = await service.getOrCreate(parsed.data.ownerRef);
      res.status(result.created ? 201 : 200).json({ success: true, data: result.wallet });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  router.get('/:ownerRef', async (req: Request, res: Response) => {
    const parsed = ownerRefParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      const wallet = await service.findByOwner(parsed.data.ownerRef);
      if (!wallet) {
        res.status(404).json({ success: false, error: 'Wallet not found' });
        return;
      }
      res.status(200).json({ success: true, data: wallet });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  return router;
}

// Default production router: mock provider + in-memory custody store.
export const walletRouter = buildWalletRouter(
  new WalletService(new InMemoryWalletRepository(), new MockWalletProvider())
);
