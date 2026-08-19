import { useCallback, useEffect, useState } from 'react';
import {
  getHandoverInstruction,
  saveHandoverInstruction
} from './handoverInstruction.api';
import type {
  HandoverInstruction,
  SaveHandoverInstructionInput
} from './handoverInstruction.types';

interface HandoverInstructionState {
  error: string | null;
  instruction: HandoverInstruction;
  loading: boolean;
  refresh: (options?: { signal?: AbortSignal }) => Promise<void>;
  save: (input: SaveHandoverInstructionInput) => Promise<HandoverInstruction>;
}

const EMPTY_INSTRUCTION: HandoverInstruction = {
  message: null,
  firstSteps: []
};

export function useHandoverInstruction(): HandoverInstructionState {
  const [instruction, setInstruction] = useState<HandoverInstruction>(EMPTY_INSTRUCTION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async ({ signal }: { signal?: AbortSignal } = {}): Promise<void> => {
      setLoading(true);
      try {
        const data = await getHandoverInstruction(signal);
        if (!signal?.aborted) {
          setInstruction(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load handover message');
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      await refresh({ signal: controller.signal });
    }

    void load();

    return () => controller.abort();
  }, [refresh]);

  const save = useCallback(
    async (input: SaveHandoverInstructionInput): Promise<HandoverInstruction> => {
      const saved = await saveHandoverInstruction(input);
      setInstruction(saved);
      setError(null);
      return saved;
    },
    []
  );

  return { error, instruction, loading, refresh, save };
}
