import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { HttpError } from '../shared/http-error';
import { AssetReferenceRepository } from './asset-reference.repository';
import { AssetReferenceService } from './asset-reference.service';
import {
  createAssetReferenceSchema,
  updateAssetReferenceSchema,
  idParamSchema
} from './asset-reference.schema';

export const assetReferenceRouter = Router();

assetReferenceRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

assetReferenceRouter.use(requireAuth);

const service = new AssetReferenceService(new AssetReferenceRepository());

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

assetReferenceRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createAssetReferenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const reference = await service.create((req as AuthenticatedRequest).authUser.id, parsed.data);
    res.status(201).json({ success: true, data: reference });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

assetReferenceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const references = await service.list((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: references });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

assetReferenceRouter.get('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    const reference = await service.getById(
      (req as AuthenticatedRequest).authUser.id,
      parsedParams.data.id
    );
    res.status(200).json({ success: true, data: reference });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

assetReferenceRouter.patch('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  const parsedBody = updateAssetReferenceSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedBody.error) });
    return;
  }

  try {
    const reference = await service.update(
      (req as AuthenticatedRequest).authUser.id,
      parsedParams.data.id,
      parsedBody.data
    );
    res.status(200).json({ success: true, data: reference });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

assetReferenceRouter.delete('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    await service.remove((req as AuthenticatedRequest).authUser.id, parsedParams.data.id);
    res.status(204).send();
  } catch (error: unknown) {
    handleError(error, res);
  }
});
