import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import {
  createTrustedContact,
  deleteTrustedContact,
  listTrustedContacts,
  updateTrustedContact
} from './trustedContact.api';
import type {
  CreateTrustedContactInput,
  TrustedContact,
  UpdateTrustedContactInput
} from './trustedContact.types';

interface UseTrustedContactsResult {
  contacts: TrustedContact[];
  loading: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
  add: (input: CreateTrustedContactInput) => Promise<TrustedContact>;
  update: (id: string, input: UpdateTrustedContactInput) => Promise<TrustedContact>;
  remove: (id: string) => Promise<void>;
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

export function useTrustedContacts(): UseTrustedContactsResult {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options: RefreshOptions = {}): Promise<void> => {
    try {
      const data = await listTrustedContacts(options.signal);
      if (!options.signal?.aborted) {
        setContacts(data);
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
    async (input: CreateTrustedContactInput): Promise<TrustedContact> => {
      const created = await createTrustedContact(input);
      // Immutable append — never mutate the existing array.
      setContacts((current) => [...current, created]);
      return created;
    },
    []
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateTrustedContactInput
    ): Promise<TrustedContact> => {
      const updated = await updateTrustedContact(id, input);
      setContacts((current) =>
        current.map((contact) => (contact.id === id ? updated : contact))
      );
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteTrustedContact(id);
    setContacts((current) => current.filter((contact) => contact.id !== id));
  }, []);

  return { contacts, loading, error, refresh, add, update, remove };
}
