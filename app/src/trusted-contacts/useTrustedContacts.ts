import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import { createTrustedContact, listTrustedContacts } from './trustedContact.api';
import type {
  CreateTrustedContactInput,
  TrustedContact
} from './trustedContact.types';

interface UseTrustedContactsResult {
  contacts: TrustedContact[];
  loading: boolean;
  error: string | null;
  add: (input: CreateTrustedContactInput) => Promise<TrustedContact>;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export function useTrustedContacts(): UseTrustedContactsResult {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load once on mount. State is only updated from the async callbacks (never
  // synchronously in the effect body) and guarded against late responses.
  useEffect(() => {
    let active = true;
    listTrustedContacts()
      .then((data) => {
        if (active) {
          setContacts(data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(toMessage(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(
    async (input: CreateTrustedContactInput): Promise<TrustedContact> => {
      const created = await createTrustedContact(input);
      // Immutable append — never mutate the existing array.
      setContacts((current) => [...current, created]);
      return created;
    },
    []
  );

  return { contacts, loading, error, add };
}
