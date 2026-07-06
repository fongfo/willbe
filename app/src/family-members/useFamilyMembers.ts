import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import {
  createFamilyMember,
  deleteFamilyMember,
  listFamilyMembers,
  updateFamilyMember
} from './familyMember.api';
import type {
  CreateFamilyMemberInput,
  FamilyMember,
  UpdateFamilyMemberInput
} from './familyMember.types';

interface UseFamilyMembersResult {
  members: FamilyMember[];
  loading: boolean;
  error: string | null;
  add: (input: CreateFamilyMemberInput) => Promise<FamilyMember>;
  update: (id: string, input: UpdateFamilyMemberInput) => Promise<FamilyMember>;
  remove: (id: string) => Promise<void>;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export function useFamilyMembers(): UseFamilyMembersResult {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load once on mount. State is only updated from the async callbacks (never
  // synchronously in the effect body) and guarded so a late response cannot
  // update an unmounted component.
  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const data = await listFamilyMembers();
        if (active) {
          setMembers(data);
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
    async (input: CreateFamilyMemberInput): Promise<FamilyMember> => {
      const created = await createFamilyMember(input);
      // Immutable append — never mutate the existing array.
      setMembers((current) => [...current, created]);
      return created;
    },
    []
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateFamilyMemberInput
    ): Promise<FamilyMember> => {
      const updated = await updateFamilyMember(id, input);
      setMembers((current) =>
        current.map((member) => (member.id === id ? updated : member))
      );
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteFamilyMember(id);
    setMembers((current) => current.filter((member) => member.id !== id));
  }, []);

  return { members, loading, error, add, update, remove };
}
