import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError } from '../shared/http-error';
import { FamilyMemberRepository } from './family-member.repository';
import { FamilyMemberService } from './family-member.service';
import {
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  idParamSchema
} from './family-member.schema';

export const familyMemberRouter = Router();

familyMemberRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const service = new FamilyMemberService(new FamilyMemberRepository());

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

familyMemberRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createFamilyMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  try {
    const member = await service.create(parsed.data);
    res.status(201).json({ success: true, data: member });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

familyMemberRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const members = await service.list();
    res.status(200).json({ success: true, data: members });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

familyMemberRouter.get('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    const member = await service.getById(parsedParams.data.id);
    res.status(200).json({ success: true, data: member });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

familyMemberRouter.patch('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  const parsedBody = updateFamilyMemberSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedBody.error) });
    return;
  }

  try {
    const member = await service.update(parsedParams.data.id, parsedBody.data);
    res.status(200).json({ success: true, data: member });
  } catch (error: unknown) {
    handleError(error, res);
  }
});

familyMemberRouter.delete('/:id', async (req: Request, res: Response) => {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsedParams.error) });
    return;
  }

  try {
    await service.remove(parsedParams.data.id);
    res.status(204).send();
  } catch (error: unknown) {
    handleError(error, res);
  }
});
