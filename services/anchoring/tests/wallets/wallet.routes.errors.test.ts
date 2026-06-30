import express from 'express';
import request from 'supertest';
import { buildWalletRouter } from '../../src/wallets/wallet.routes';
import { WalletService } from '../../src/wallets/wallet.service';
import { MockWalletProvider } from '../../src/wallets/wallet.provider';
import { HttpError } from '../../src/shared/http-error';
import type { StoredWallet } from '../../src/wallets/wallet.types';
import type { WalletRepository } from '../../src/wallets/wallet.repository';

// A repository whose reads fail, used to drive the routes' error-handling paths.
class ThrowingRepository implements WalletRepository {
  constructor(private readonly error: Error) {}

  async findByOwner(): Promise<StoredWallet | null> {
    throw this.error;
  }

  async save(wallet: StoredWallet): Promise<StoredWallet> {
    return wallet;
  }
}

function appWith(error: Error) {
  const service = new WalletService(new ThrowingRepository(error), new MockWalletProvider());
  const app = express();
  app.use(express.json());
  app.use('/api/wallets', buildWalletRouter(service));
  return app;
}

describe('Wallet routes — error handling', () => {
  it('maps an unexpected error to 500 without leaking details', async () => {
    const res = await request(appWith(new Error('db exploded')))
      .post('/api/wallets')
      .send({ ownerRef: 'boom' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('db exploded');
  });

  it('maps an HttpError to its status and message', async () => {
    const res = await request(appWith(new HttpError(503, 'Custodian unavailable'))).get(
      '/api/wallets/anyone'
    );

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, error: 'Custodian unavailable' });
  });

  it('rejects a blank owner reference in the path with 400', async () => {
    const res = await request(appWith(new Error('unused'))).get('/api/wallets/%20');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
