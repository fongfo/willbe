import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import { createFamilyMember, listFamilyMembers } from './familyMember.api';
import type { CreateFamilyMemberInput, FamilyMember } from './familyMember.types';

interface UseFamilyMembersResult {
  members: FamilyMember[];
  loading: boolean;
  error: string | null;
  add: (input: CreateFamilyMemberInput) => Promise<FamilyMember>;
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
    listFamilyMembers()
      .then((data) => {
        if (active) {
          setMembers(data);
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
    async (input: CreateFamilyMemberInput): Promise<FamilyMember> => {
      const created = await createFamilyMember(input);
      // Immutable append — never mutate the existing array.
      setMembers((current) => [...current, created]);
      return created;
    },
    []
  );

  return { members, loading, error, add };
}
