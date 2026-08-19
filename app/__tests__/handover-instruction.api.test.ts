import { apiClient } from '../src/api';
import {
  getHandoverInstruction,
  saveHandoverInstruction
} from '../src/handover-instructions/handoverInstruction.api';
import type { HandoverInstruction } from '../src/handover-instructions/handoverInstruction.types';

jest.mock('../src/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() }
}));

const mockedApi = apiClient as unknown as {
  get: jest.Mock;
  put: jest.Mock;
};

const instruction: HandoverInstruction = {
  id: 'h1',
  userId: 'user-1',
  message: 'Take a breath, then call Sara.',
  firstSteps: ['Call Sara', 'Open Drive / Family'],
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z'
};

afterEach(() => jest.clearAllMocks());

describe('getHandoverInstruction', () => {
  it('returns the saved instruction from the API', async () => {
    mockedApi.get.mockResolvedValue(instruction);

    await expect(getHandoverInstruction()).resolves.toEqual(instruction);
    expect(mockedApi.get).toHaveBeenCalledWith('/handover-instruction', undefined);
  });

  it('defaults to an empty instruction when the API returns no data', async () => {
    mockedApi.get.mockResolvedValue(undefined);

    await expect(getHandoverInstruction()).resolves.toEqual({
      message: null,
      firstSteps: []
    });
  });
});

describe('saveHandoverInstruction', () => {
  it('puts the input and returns the saved instruction', async () => {
    mockedApi.put.mockResolvedValue(instruction);

    const result = await saveHandoverInstruction({
      message: 'Take a breath, then call Sara.',
      firstSteps: ['Call Sara', 'Open Drive / Family']
    });

    expect(result).toEqual(instruction);
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/handover-instruction',
      {
        message: 'Take a breath, then call Sara.',
        firstSteps: ['Call Sara', 'Open Drive / Family']
      },
      undefined
    );
  });

  it('throws when the API returns no data', async () => {
    mockedApi.put.mockResolvedValue(undefined);

    await expect(
      saveHandoverInstruction({ message: null, firstSteps: [] })
    ).rejects.toThrow('no data');
  });
});
