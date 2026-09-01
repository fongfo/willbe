import express from 'express';
import request from 'supertest';
import { AuthService } from '../../src/auth/auth.service';
import { requireAuth } from '../../src/auth/require-auth';
import type { AuthenticatedRequest } from '../../src/auth/authenticated-request';

describe('requireAuth', () => {
  afterEach(() => jest.restoreAllMocks());

  it('passes the Privy identity token header into session creation', async () => {
    const user = {
      id: 'user-1',
      privyUserId: 'did:privy:user-1',
      email: 'imran@example.com',
      name: null,
      walletAddress: null,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-01T00:00:00.000Z')
    };
    const createSession = jest
      .spyOn(AuthService.prototype, 'createSession')
      .mockResolvedValue({ user });
    const app = express();

    app.get('/probe', requireAuth, (req, res) => {
      res.status(200).json({ email: (req as AuthenticatedRequest).authUser.email });
    });

    const res = await request(app)
      .get('/probe')
      .set('Authorization', 'Bearer privy-access-token')
      .set('X-Privy-Identity-Token', 'privy-identity-token');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('imran@example.com');
    expect(createSession).toHaveBeenCalledWith(
      'privy-access-token',
      'privy-identity-token'
    );
  });
});
