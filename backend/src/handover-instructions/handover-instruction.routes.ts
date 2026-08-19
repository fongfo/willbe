import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { HttpError } from '../shared/http-error';
import { HandoverInstructionRepository } from './handover-instruction.repository';
import { HandoverInstructionService } from './handover-instruction.service';
import { updateHandoverInstructionSchema } from './handover-instruction.schema';

export const handoverInstructionRouter = Router();

handoverInstructionRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

handoverInstructionRouter.use(requireAuth);

const service = new HandoverInstructionService(new HandoverInstructionRepository());

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Invalid request';
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

handoverInstructionRouter.get('/', async (req: Request, res: Response) => {
  try {
    const instruction = await service.get((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: instruction });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

handoverInstructionRouter.put('/', async (req: Request, res: Response) => {
  const parsed = updateHandoverInstructionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const instruction = await service.save(
      (req as AuthenticatedRequest).authUser.id,
      parsed.data
    );
    res.status(200).json({ success: true, data: instruction });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
