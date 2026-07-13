import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { HttpError } from '../shared/http-error';
import { TrustedContactRepository } from '../trusted-contacts/trusted-contact.repository';
import { AssetReferenceRepository } from '../asset-references/asset-reference.repository';
import { HandoverService } from './handover.service';

export const handoverRouter = Router();

handoverRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

handoverRouter.use(requireAuth);

const service = new HandoverService({
  trustedContacts: new TrustedContactRepository(),
  assetReferences: new AssetReferenceRepository()
});

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

handoverRouter.get('/', async (req: Request, res: Response) => {
  try {
    const view = await service.preview((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: view });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
