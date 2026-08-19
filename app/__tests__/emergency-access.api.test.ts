import { apiClient } from '../src/api';
import {
  closeEmergencyAccessRequest,
  createEmergencyAccessRequest,
  getContactAccessContext,
  getContactEmergencyHandover
} from '../src/emergency-access/emergencyAccess.api';

jest.mock('../src/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() }
}));

const mockedApi = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

afterEach(() => jest.clearAllMocks());

describe('emergencyAccess.api', () => {
  it('loads contact context from the emergency access API', async () => {
    mockedApi.get.mockResolvedValue([{ id: 'tc1' }]);

    await expect(getContactAccessContext()).resolves.toEqual([{ id: 'tc1' }]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/emergency-access/contact/context',
      undefined
    );
  });

  it('creates an emergency access request', async () => {
    mockedApi.post.mockResolvedValue({ id: 'req1', status: 'COOLING_OFF' });

    await createEmergencyAccessRequest({
      ownerUserId: 'owner-1',
      trustedContactId: 'tc1',
      reason: 'UNREACHABLE',
      confirmed: true
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/emergency-access/contact/requests',
      expect.objectContaining({ reason: 'UNREACHABLE', confirmed: true }),
      undefined
    );
  });

  it('loads the active handover payload', async () => {
    mockedApi.get.mockResolvedValue({ steps: ['Call Sara'] });

    await expect(getContactEmergencyHandover('req1')).resolves.toEqual({
      steps: ['Call Sara']
    });
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/emergency-access/contact/requests/req1/handover',
      undefined
    );
  });

  it('closes emergency access', async () => {
    mockedApi.post.mockResolvedValue({ id: 'req1', status: 'CLOSED' });

    await closeEmergencyAccessRequest('req1');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/emergency-access/contact/requests/req1/close',
      {},
      undefined
    );
  });

  it('throws when mutation endpoints return no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);

    await expect(
      createEmergencyAccessRequest({
        ownerUserId: 'owner-1',
        trustedContactId: 'tc1',
        reason: 'OTHER',
        confirmed: true
      })
    ).rejects.toThrow('no data');
    await expect(closeEmergencyAccessRequest('req1')).rejects.toThrow('no data');
  });
});
