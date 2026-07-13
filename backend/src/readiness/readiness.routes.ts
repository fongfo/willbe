import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { HttpError } from '../shared/http-error';
import { FamilyMemberRepository } from '../family-members/family-member.repository';
import { TrustedContactRepository } from '../trusted-contacts/trusted-contact.repository';
import { AssetReferenceRepository } from '../asset-references/asset-reference.repository';
import { ReviewSettingRepository } from '../review-settings/review-setting.repository';
import { ReadinessService } from './readiness.service';

export const readinessRouter = Router();

readinessRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

readinessRouter.use(requireAuth);

const service = new ReadinessService({
  familyMembers: new FamilyMemberRepository(),
  trustedContacts: new TrustedContactRepository(),
  assetReferences: new AssetReferenceRepository(),
  reviewSetting: new ReviewSettingRepository()
});

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

readinessRouter.get('/', async (req: Request, res: Response) => {
  try {
    const assessment = await service.assess((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: assessment });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
