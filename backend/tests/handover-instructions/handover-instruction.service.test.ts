import { HandoverInstructionService } from '../../src/handover-instructions/handover-instruction.service';

const savedInstruction = {
  id: 'instruction-1',
  userId: 'user-1',
  message: 'Call Sara first.',
  firstSteps: ['Call Sara'],
  createdAt: new Date('2026-08-19T00:00:00Z'),
  updatedAt: new Date('2026-08-19T00:00:00Z')
};

function createRepository() {
  return {
    get: jest.fn(),
    upsert: jest.fn()
  };
}

describe('HandoverInstructionService', () => {
  it('returns the saved instruction when present', async () => {
    const repository = createRepository();
    repository.get.mockResolvedValue(savedInstruction);
    const service = new HandoverInstructionService(repository);

    await expect(service.get('user-1')).resolves.toBe(savedInstruction);
    expect(repository.get).toHaveBeenCalledWith('user-1');
  });

  it('returns a default empty instruction before first save', async () => {
    const repository = createRepository();
    repository.get.mockResolvedValue(null);
    const service = new HandoverInstructionService(repository);

    await expect(service.get('user-1')).resolves.toEqual({
      message: null,
      firstSteps: []
    });
  });

  it('saves through the repository', async () => {
    const repository = createRepository();
    repository.upsert.mockResolvedValue(savedInstruction);
    const service = new HandoverInstructionService(repository);

    const result = await service.save('user-1', {
      message: 'Call Sara first.',
      firstSteps: ['Call Sara']
    });

    expect(repository.upsert).toHaveBeenCalledWith('user-1', {
      message: 'Call Sara first.',
      firstSteps: ['Call Sara']
    });
    expect(result).toBe(savedInstruction);
  });
});
