import type { HandoverInstructionModel as HandoverInstruction } from '../generated/prisma/models';
import type { UpdateHandoverInstructionInput } from './handover-instruction.schema';

export interface HandoverInstructionView {
  message: string | null;
  firstSteps: string[];
}

export interface HandoverInstructionRepositoryLike {
  get(userId: string): Promise<HandoverInstruction | null>;
  upsert(userId: string, data: UpdateHandoverInstructionInput): Promise<HandoverInstruction>;
}

const DEFAULT_INSTRUCTION: HandoverInstructionView = {
  message: null,
  firstSteps: []
};

export class HandoverInstructionService {
  constructor(private readonly repository: HandoverInstructionRepositoryLike) {}

  async get(userId: string): Promise<HandoverInstruction | HandoverInstructionView> {
    const instruction = await this.repository.get(userId);
    return instruction ?? DEFAULT_INSTRUCTION;
  }

  save(userId: string, input: UpdateHandoverInstructionInput): Promise<HandoverInstruction> {
    return this.repository.upsert(userId, input);
  }
}
