export interface HandoverInstruction {
  id?: string;
  userId?: string;
  message: string | null;
  firstSteps: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveHandoverInstructionInput {
  message?: string | null;
  firstSteps: string[];
}
