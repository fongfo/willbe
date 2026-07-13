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

trustedContactRouter.post('/:id/verify', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    const contact = await service.verify(
      (req as AuthenticatedRequest).authUser.id,
      parsedParams.data.id
    );
    res.status(200).json({ success: true, data: contact });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
