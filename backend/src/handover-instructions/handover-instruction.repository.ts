import { prisma } from '../db/client';
import type { HandoverInstructionModel as HandoverInstruction } from '../generated/prisma/models';
import type { UpdateHandoverInstructionInput } from './handover-instruction.schema';

export class HandoverInstructionRepository {
  get(userId: string): Promise<HandoverInstruction | null> {
    return prisma.handoverInstruction.findUnique({ where: { userId } });
  }

  upsert(
    userId: string,
    data: UpdateHandoverInstructionInput
  ): Promise<HandoverInstruction> {
    return prisma.handoverInstruction.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data
    });
  }
}
