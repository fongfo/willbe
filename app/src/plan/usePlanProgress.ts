import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import type { PlanSetupProgress } from './planProgress';
import { getPlanProgress } from './planProgress.api';

interface UsePlanProgressResult {
  progress: PlanSetupProgress;
  loading: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
}

interface RefreshOptions {
  signal?: AbortSignal;
}

const EMPTY_PROGRESS: PlanSetupProgress = {
  completedSetupSteps: 0,
  hasFamilyMembers: false,
  hasTrustedContacts: false,
  hasAssetReferences: false,
  hasCheckInSetup: false
};

function toMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export function usePlanProgress(): UsePlanProgressResult {
  const [progress, setProgress] = useState<PlanSetupProgress>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options: RefreshOptions = {}): Promise<void> => {
    try {
      const data = await getPlanProgress(options.signal);
      if (!options.signal?.aborted) {
        setProgress(data);
        setError(null);
      }
    } catch (err: unknown) {
      if (!options.signal?.aborted) {
        setError(toMessage(err));
      }
    } finally {
      if (!options.signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      await refresh({ signal: controller.signal });
    }

    void load();

    return () => controller.abort();
  }, [refresh]);

  return { progress, loading, error, refresh };
}
