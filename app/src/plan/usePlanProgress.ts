import { useEffect, useState } from 'react';
import { ApiError } from '../api';
import type { PlanSetupProgress } from './planProgress';
import { getPlanProgress } from './planProgress.api';

interface UsePlanProgressResult {
  progress: PlanSetupProgress;
  loading: boolean;
  error: string | null;
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

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const data = await getPlanProgress();
        if (active) {
          setProgress(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setError(toMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { progress, loading, error };
}
