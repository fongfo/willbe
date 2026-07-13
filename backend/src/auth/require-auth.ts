import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../shared/http-error';
import { UserRepository } from '../users/user.repository';
import { UserService } from '../users/user.service';
import { AuthService } from './auth.service';
import { createTokenVerifier } from './token-verifier';
import type { AuthenticatedRequest } from './authenticated-request';

const service = new AuthService(
  createTokenVerifier(),
  new UserService(new UserRepository())
);

function extractBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = header.slice('Bearer '.length).trim();
  return token || undefined;
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accessToken = extractBearerToken(req.header('Authorization'));
  if (!accessToken) {
    res.status(401).json({ success: false, error: 'Missing access token' });
    return;
  }

  try {
    const session = await service.createSession(accessToken);
    (req as AuthenticatedRequest).authUser = session.user;
    next();
  } catch (error: unknown) {
    handleError(error, res);
  }
}

