import { apiClient } from '../api';
import type {
  HandoverInstruction,
  SaveHandoverInstructionInput
} from './handoverInstruction.types';

const RESOURCE = '/handover-instruction';

export async function getHandoverInstruction(
  signal?: AbortSignal
): Promise<HandoverInstruction> {
  const data = await apiClient.get<HandoverInstruction>(RESOURCE, signal);
  return data ?? { message: null, firstSteps: [] };
}

export async function saveHandoverInstruction(
  input: SaveHandoverInstructionInput,
  signal?: AbortSignal
): Promise<HandoverInstruction> {
  const data = await apiClient.put<HandoverInstruction>(RESOURCE, input, signal);
  if (!data) {
    throw new Error('Handover instruction save returned no data');
  }
  return data;
}
