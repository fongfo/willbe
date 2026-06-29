import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError } from '../shared/http-error';
import { ReviewSettingRepository } from './review-setting.repository';
import { ReviewSettingService } from './review-setting.service';
import { updateReviewSettingSchema } from './review-setting.schema';

export const reviewSettingRouter = Router();

reviewSettingRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const service = new ReviewSettingService(new ReviewSettingRepository());

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

reviewSettingRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const setting = await service.get();
    res.status(200).json({ success: true, data: setting });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

reviewSettingRouter.put('/', async (req: Request, res: Response) => {
  const parsed = updateReviewSettingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const setting = await service.save(parsed.data);
    res.status(200).json({ success: true, data: setting });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
