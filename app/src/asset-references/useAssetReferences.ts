import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import { createAssetReference, listAssetReferences } from './assetReference.api';
import type {
  AssetReference,
  CreateAssetReferenceInput
} from './assetReference.types';

interface UseAssetReferencesResult {
  references: AssetReference[];
  loading: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
  add: (input: CreateAssetReferenceInput) => Promise<AssetReference>;
}

interface RefreshOptions {
  signal?: AbortSignal;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export function useAssetReferences(): UseAssetReferencesResult {
  const [references, setReferences] = useState<AssetReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options: RefreshOptions = {}): Promise<void> => {
    try {
      const data = await listAssetReferences(options.signal);
      if (!options.signal?.aborted) {
        setReferences(data);
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

  const add = useCallback(
    async (input: CreateAssetReferenceInput): Promise<AssetReference> => {
      const created = await createAssetReference(input);
      // Immutable append — never mutate the existing array.
      setReferences((current) => [...current, created]);
      return created;
    },
    []
  );

  return { references, loading, error, refresh, add };
}
