import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { HttpError } from '../shared/http-error';
import { PlanProgressRepository } from './plan-progress.repository';
import { PlanProgressService } from './plan-progress.service';

export const planProgressRouter = Router();

planProgressRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

planProgressRouter.use(requireAuth);

const service = new PlanProgressService(new PlanProgressRepository());

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

planProgressRouter.get('/', async (req: Request, res: Response) => {
  try {
    const progress = await service.get((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: progress });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
