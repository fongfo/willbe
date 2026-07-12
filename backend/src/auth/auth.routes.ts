import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError } from '../shared/http-error';
import { UserRepository } from '../users/user.repository';
import { UserService } from '../users/user.service';
import { authSessionBodySchema } from './auth.schema';
import { AuthService } from './auth.service';
import { createTokenVerifier } from './token-verifier';

export const authRouter = Router();

authRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const service = new AuthService(
  createTokenVerifier(),
  new UserService(new UserRepository())
);

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Invalid request';
}

function extractBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }
  return header.slice('Bearer '.length).trim();
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

authRouter.post('/session', async (req: Request, res: Response) => {
  const parsed = authSessionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
    return;
  }

  const accessToken = extractBearerToken(req.header('authorization')) ?? parsed.data.accessToken;
  if (!accessToken) {
    res.status(401).json({ success: false, error: 'Access token is required' });
    return;
  }

  try {
    const session = await service.createSession(accessToken, parsed.data.identityToken);
    res.status(200).json({ success: true, data: session });
  } catch (error: unknown) {
    handleError(error, res);
  }
});
