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
  add: (input: CreateAssetReferenceInput) => Promise<AssetReference>;
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

  // Load once on mount. State is only updated from the async callbacks (never
  // synchronously in the effect body) and guarded against late responses.
  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const data = await listAssetReferences();
        if (active) {
          setReferences(data);
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

  const add = useCallback(
    async (input: CreateAssetReferenceInput): Promise<AssetReference> => {
      const created = await createAssetReference(input);
      // Immutable append — never mutate the existing array.
      setReferences((current) => [...current, created]);
      return created;
    },
    []
  );

  return { references, loading, error, add };
}
