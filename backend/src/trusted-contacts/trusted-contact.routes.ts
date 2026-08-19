import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/require-auth';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { HttpError } from '../shared/http-error';
import { TrustedContactRepository } from './trusted-contact.repository';
import { TrustedContactService } from './trusted-contact.service';
import {
  createTrustedContactSchema,
  updateTrustedContactSchema,
  idParamSchema
} from './trusted-contact.schema';

export const trustedContactRouter = Router();

trustedContactRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

trustedContactRouter.use(requireAuth);

const service = new TrustedContactService(new TrustedContactRepository());

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Invalid request';
}

function toContactAccountView(contact: {
  id: string;
  userId: string;
  name: string;
  relation: string;
  role: string;
  phone: string;
  email: string | null;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}): Record<string, unknown> {
  return {
    id: contact.id,
    ownerUserId: contact.userId,
    name: contact.name,
    relation: contact.relation,
    role: contact.role,
    phone: contact.phone,
    email: contact.email,
    verificationStatus: contact.verificationStatus,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt
  };
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

trustedContactRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createTrustedContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const contact = await service.create((req as AuthenticatedRequest).authUser.id, parsed.data);
    res.status(201).json({ success: true, data: contact });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

trustedContactRouter.get('/', async (req: Request, res: Response) => {
  try {
    const contacts = await service.list((req as AuthenticatedRequest).authUser.id);
    res.status(200).json({ success: true, data: contacts });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

trustedContactRouter.get('/assigned-plans', async (req: Request, res: Response) => {
  try {
    const contacts = await service.listAssignments((req as AuthenticatedRequest).authUser.id);
    const data = contacts.map((contact) => ({
      id: contact.id,
      ownerUserId: contact.userId,
      planner: {
        id: contact.user.id,
        name: contact.user.name,
        email: contact.user.email
      },
      name: contact.name,
      relation: contact.relation,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      verificationStatus: contact.verificationStatus,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }));
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

trustedContactRouter.get('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    const contact = await service.getById(
      (req as AuthenticatedRequest).authUser.id,
      parsedParams.data.id
    );
    res.status(200).json({ success: true, data: contact });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

trustedContactRouter.patch('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  const parsedBody = updateTrustedContactSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedBody.error) });
    return;
  }

  try {
    const contact = await service.update(
      (req as AuthenticatedRequest).authUser.id,
      parsedParams.data.id,
      parsedBody.data
    );
    res.status(200).json({ success: true, data: contact });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

trustedContactRouter.delete('/:id', async (req: Request, res: Response) => {
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

trustedContactRouter.post('/:id/bind', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    const authUser = (req as AuthenticatedRequest).authUser;
    const contact = await service.bindAuthenticatedContact(
      parsedParams.data.id,
      authUser.id,
      authUser.email
    );
    res.status(200).json({ success: true, data: toContactAccountView(contact) });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

trustedContactRouter.post('/:id/verify', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  res.status(410).json({
    success: false,
    error: 'Trusted contact verification must be completed from the contact account'
  });
});
