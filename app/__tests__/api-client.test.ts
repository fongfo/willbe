import { apiClient, request } from '../src/api/client';
import { getApiBaseUrl, resolveApiBaseUrl } from '../src/api/config';
import { ApiError } from '../src/api/errors';

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: null }),
    ...response
  });
  (globalThis as { fetch: unknown }).fetch = fn;
  return fn;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('resolveApiBaseUrl', () => {
  it('falls back to the local backend default when unset', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('http://localhost:4000/api');
    expect(resolveApiBaseUrl('   ')).toBe('http://localhost:4000/api');
  });

  it('treats the inlined "undefined" sentinel as unset', () => {
    expect(resolveApiBaseUrl('undefined')).toBe('http://localhost:4000/api');
  });

  it('prefers the override and trims a trailing slash', () => {
    expect(resolveApiBaseUrl('https://api.pusaka.app/api/')).toBe(
      'https://api.pusaka.app/api'
    );
  });

  it('resolves the default in the current test environment', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:4000/api');
  });
});

describe('apiClient', () => {
  it('unwraps the data payload on success', async () => {
    const fetchFn = mockFetch({
      json: async () => ({ success: true, data: { id: '1', name: 'Ada' } })
    });

    const result = await apiClient.get<{ id: string; name: string }>('/family-members');

    expect(result).toEqual({ id: '1', name: 'Ada' });
    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:4000/api/family-members',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('normalises a path without a leading slash', async () => {
    const fetchFn = mockFetch({ json: async () => ({ success: true, data: [] }) });
    await apiClient.get('family-members');
    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:4000/api/family-members',
      expect.anything()
    );
  });

  it('serialises the body and sets the JSON content-type on POST', async () => {
    const fetchFn = mockFetch({
      status: 201,
      json: async () => ({ success: true, data: { id: '2' } })
    });

    await apiClient.post('/family-members', { name: 'Grace' });

    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:4000/api/family-members',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Grace' })
      })
    );
  });

  it('returns undefined for a 204 without touching the body', async () => {
    const json = jest.fn();
    mockFetch({ status: 204, ok: true, json });

    await expect(apiClient.delete('/family-members/1')).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('throws ApiError carrying the server status and message', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'name is required' })
    });

    await expect(apiClient.post('/family-members', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'name is required'
    });
  });

  it('throws ApiError with a fallback message when the body is not JSON', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      }
    });

    await expect(request('/family-members')).rejects.toBeInstanceOf(ApiError);
    await expect(request('/family-members')).rejects.toThrow('status 500');
  });
});
