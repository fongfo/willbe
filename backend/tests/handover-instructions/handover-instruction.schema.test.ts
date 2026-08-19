import { updateHandoverInstructionSchema } from '../../src/handover-instructions/handover-instruction.schema';

describe('updateHandoverInstructionSchema', () => {
  it('accepts a message and first steps', () => {
    const result = updateHandoverInstructionSchema.safeParse({
      message: 'Start with Sara, then open the family folder.',
      firstSteps: ['Call Sara', 'Open Drive / Family']
    });

    expect(result.success).toBe(true);
  });

  it('trims message and step text', () => {
    const result = updateHandoverInstructionSchema.safeParse({
      message: '  Take a breath.  ',
      firstSteps: ['  Call Imran  ']
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe('Take a breath.');
      expect(result.data.firstSteps).toEqual(['Call Imran']);
    }
  });

  it('allows a null message and empty first steps', () => {
    const result = updateHandoverInstructionSchema.safeParse({
      message: null,
      firstSteps: []
    });

    expect(result.success).toBe(true);
  });

  it('rejects more than eight first steps', () => {
    const result = updateHandoverInstructionSchema.safeParse({
      message: null,
      firstSteps: Array.from({ length: 9 }, (_, index) => `Step ${index + 1}`)
    });

    expect(result.success).toBe(false);
  });

  it('rejects duplicate first steps', () => {
    const result = updateHandoverInstructionSchema.safeParse({
      message: null,
      firstSteps: ['Call Sara', 'Call Sara']
    });

    expect(result.success).toBe(false);
  });

  it('rejects unexpected fields such as passwords', () => {
    const result = updateHandoverInstructionSchema.safeParse({
      message: 'Use the folder',
      firstSteps: [],
      password: 'secret'
    });

    expect(result.success).toBe(false);
  });
});
