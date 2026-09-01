import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AssetReferenceRepository } from '../asset-references/asset-reference.repository';
import { FamilyMemberRepository } from '../family-members/family-member.repository';
import { HandoverInstructionRepository } from '../handover-instructions/handover-instruction.repository';
import { HandoverService } from '../handover/handover.service';
import { HttpError } from '../shared/http-error';
import { TrustedContactRepository } from '../trusted-contacts/trusted-contact.repository';
import { EmergencyAccessRepository } from './emergency-access.repository';
import type {
  EmergencyAccessRequestWithContact,
  TrustedContactAccessAssignment
} from './emergency-access.repository';
import { EmergencyAccessService } from './emergency-access.service';
import {
  createEmergencyAccessRequestSchema,
  idParamSchema,
  updateEmergencyAccessSettingsSchema
} from './emergency-access.schema';

export const emergencyAccessRouter = Router();

emergencyAccessRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

emergencyAccessRouter.use(requireAuth);

const service = new EmergencyAccessService(
  new EmergencyAccessRepository(),
  () => new Date(),
  new HandoverService({
    familyMembers: new FamilyMemberRepository(),
    trustedContacts: new TrustedContactRepository(),
    assetReferences: new AssetReferenceRepository(),
    handoverInstructions: new HandoverInstructionRepository()
  })
);

function serializeAssignment(assignment: TrustedContactAccessAssignment) {
  const latestRequest = assignment.emergencyAccessRequests?.[0] ?? null;
  return {
    id: assignment.id,
    ownerUserId: assignment.userId,
    name: assignment.name,
    relation: assignment.relation,
    role: assignment.role,
    phone: assignment.phone,
    email: assignment.email,
    verificationStatus: assignment.verificationStatus,
    planner: assignment.user,
    latestRequest
  };
}

function serializeRequest<T extends EmergencyAccessRequestWithContact>(request: T) {
  return {
    ...request,
    trustedContact: {
      id: request.trustedContact.id,
      name: request.trustedContact.name,
      relation: request.trustedContact.relation,
      role: request.trustedContact.role,
      phone: request.trustedContact.phone,
      email: request.trustedContact.email,
      verificationStatus: request.trustedContact.verificationStatus
    }
  };
}

function serializeSettings(settings: { requireBackupConfirmation: boolean }) {
  return {
    requireBackupConfirmation: settings.requireBackupConfirmation
  };
}

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

function parseId(req: Request, res: Response): string | undefined {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return undefined;
  }
  return parsed.data.id;
}

emergencyAccessRouter.get('/contact/context', async (req: Request, res: Response) => {
  try {
    const assignments = await service.listContactContext(
      (req as AuthenticatedRequest).authUser.id
    );
    res.status(200).json({ success: true, data: assignments.map(serializeAssignment) });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

emergencyAccessRouter.get(
  '/contact/assignments/:id/handover',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const view = await service.getVerifiedContactHandover(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: view });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.get('/owner/settings', async (req: Request, res: Response) => {
  try {
    const settings = await service.getSettings((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: serializeSettings(settings) });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

emergencyAccessRouter.put('/owner/settings', async (req: Request, res: Response) => {
  const parsed = updateEmergencyAccessSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const settings = await service.updateSettings(
      (req as AuthenticatedRequest).authUser.id,
      parsed.data
    );
    res.status(200).json({ success: true, data: serializeSettings(settings) });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

emergencyAccessRouter.post('/contact/requests', async (req: Request, res: Response) => {
  const parsed = createEmergencyAccessRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const request = await service.createRequest(
      (req as AuthenticatedRequest).authUser.id,
      parsed.data
    );
    res.status(201).json({ success: true, data: request });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

emergencyAccessRouter.get('/contact/requests/:id', async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (!id) {
    return;
  }

  try {
    const request = await service.getContactRequest(
      (req as AuthenticatedRequest).authUser.id,
      id
    );
    res.status(200).json({ success: true, data: serializeRequest(request) });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

emergencyAccessRouter.get(
  '/contact/requests/:id/handover',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const view = await service.getActiveContactHandover(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: view });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.post(
  '/contact/requests/:id/close',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.closeContactRequest(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.post(
  '/contact/requests/:id/backup-confirm',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.confirmBackupReview(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.post(
  '/contact/requests/:id/backup-deny',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.denyBackupReview(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.get('/owner/requests', async (req: Request, res: Response) => {
  try {
    const requests = await service.listOwnerRequests(
      (req as AuthenticatedRequest).authUser.id
    );
    res.status(200).json({ success: true, data: requests.map(serializeRequest) });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

emergencyAccessRouter.post(
  '/owner/requests/:id/reject',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.rejectOwnerRequest(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.post(
  '/owner/requests/:id/revoke',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.revokeOwnerRequest(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.post(
  '/owner/requests/:id/secondary-review',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.startSecondaryReview(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);

emergencyAccessRouter.post(
  '/owner/requests/:id/activate',
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (!id) {
      return;
    }

    try {
      const request = await service.activateForReview(
        (req as AuthenticatedRequest).authUser.id,
        id
      );
      res.status(200).json({ success: true, data: request });
    } catch (error: unknown) {
      handleError(error, res);
    }
  }
);
