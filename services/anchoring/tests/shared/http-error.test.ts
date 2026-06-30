import { HttpError } from '../../src/shared/http-error';

describe('HttpError', () => {
  it('carries a status code and message and is an Error', () => {
    const error = new HttpError(404, 'Wallet not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Wallet not found');
    expect(error.name).toBe('HttpError');
  });
});
