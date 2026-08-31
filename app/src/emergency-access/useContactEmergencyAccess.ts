import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api';
import { bindTrustedContactInvite } from '../trusted-contacts/trustedContact.api';
import {
  closeEmergencyAccessRequest,
  confirmBackupEmergencyAccessRequest,
  createEmergencyAccessRequest,
  denyBackupEmergencyAccessRequest,
  getContactAccessContext,
  getContactEmergencyHandover
} from './emergencyAccess.api';
import type {
  ContactAccessAssignment,
  ContactEmergencyHandover,
  CreateEmergencyAccessRequestInput,
  EmergencyAccessRequestSummary
} from './emergencyAccess.types';

interface RefreshOptions {
  signal?: AbortSignal;
}

interface UseContactEmergencyAccessResult {
  assignments: ContactAccessAssignment[];
  selectedAssignment: ContactAccessAssignment | null;
  currentRequest: EmergencyAccessRequestSummary | null;
  handover: ContactEmergencyHandover | null;
  loading: boolean;
  handoverLoading: boolean;
  submitting: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
  selectAssignment: (assignmentId: string) => Promise<void>;
  requestAccess: (
    input: Omit<CreateEmergencyAccessRequestInput, 'ownerUserId' | 'trustedContactId'>
  ) => Promise<void>;
  bindInviteToken: (inviteToken: string) => Promise<void>;
  closeAccess: () => Promise<void>;
  confirmBackupReview: () => Promise<void>;
  denyBackupReview: () => Promise<void>;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

function shouldFetchHandover(request: EmergencyAccessRequestSummary | null): boolean {
  return request?.status === 'ACTIVE';
}

function effectiveRequest(
  request: EmergencyAccessRequestSummary | null
): EmergencyAccessRequestSummary | null {
  if (
    request?.status === 'ACTIVE' &&
    request.expiresAt &&
    new Date(request.expiresAt) <= new Date()
  ) {
    return { ...request, status: 'EXPIRED' };
  }
  return request;
}

export function useContactEmergencyAccess(): UseContactEmergencyAccessResult {
  const [assignments, setAssignments] = useState<ContactAccessAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] =
    useState<EmergencyAccessRequestSummary | null>(null);
  const [handover, setHandover] = useState<ContactEmergencyHandover | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedAssignmentIdRef = useRef<string | null>(null);
  const selectedAssignment = useMemo(
    () =>
      assignments.find((assignment) => assignment.id === selectedAssignmentId) ??
      assignments[0] ??
      null,
    [assignments, selectedAssignmentId]
  );

  useEffect(() => {
    selectedAssignmentIdRef.current = selectedAssignmentId;
  }, [selectedAssignmentId]);

  const loadHandover = useCallback(
    async (request: EmergencyAccessRequestSummary, signal?: AbortSignal): Promise<void> => {
      setHandoverLoading(true);
      try {
        const data = await getContactEmergencyHandover(request.id, signal);
        if (!signal?.aborted) {
          setHandover(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!signal?.aborted) {
          setHandover(null);
          setError(toMessage(err));
        }
      } finally {
        if (!signal?.aborted) {
          setHandoverLoading(false);
        }
      }
    },
    []
  );

  const refresh = useCallback(
    async (options: RefreshOptions = {}): Promise<void> => {
      setLoading(true);
      try {
        const data = await getContactAccessContext(options.signal);
        if (options.signal?.aborted) {
          return;
        }
        const currentSelectedAssignmentId = selectedAssignmentIdRef.current;
        const selected =
          data.find((assignment) => assignment.id === currentSelectedAssignmentId) ??
          data[0] ??
          null;
        const latest = effectiveRequest(selected?.latestRequest ?? null);
        setAssignments(data);
        selectedAssignmentIdRef.current = selected?.id ?? null;
        setSelectedAssignmentId(selected?.id ?? null);
        setCurrentRequest(latest);
        setHandover(null);
        setError(null);
        if (latest && shouldFetchHandover(latest)) {
          await loadHandover(latest, options.signal);
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
    },
    [loadHandover]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      await refresh({ signal: controller.signal });
    }

    void load();
    return () => controller.abort();
  }, [refresh]);

  const requestAccess = useCallback(
    async (
      input: Omit<CreateEmergencyAccessRequestInput, 'ownerUserId' | 'trustedContactId'>
    ): Promise<void> => {
      if (!selectedAssignment) {
        throw new Error('No verified emergency contact assignment found');
      }
      setSubmitting(true);
      setError(null);
      try {
        const request = await createEmergencyAccessRequest({
          ...input,
          ownerUserId: selectedAssignment.ownerUserId,
          trustedContactId: selectedAssignment.id
        });
        setCurrentRequest(effectiveRequest(request));
        setHandover(null);
      } catch (err: unknown) {
        setError(toMessage(err));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [selectedAssignment]
  );

  const bindInviteToken = useCallback(
    async (inviteToken: string): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await bindTrustedContactInvite(inviteToken);
        await refresh();
      } catch (err: unknown) {
        setError(toMessage(err));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const closeAccess = useCallback(async (): Promise<void> => {
    if (!currentRequest) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const request = await closeEmergencyAccessRequest(currentRequest.id);
      setCurrentRequest(effectiveRequest(request));
      setHandover(null);
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [currentRequest]);

  const confirmBackupReview = useCallback(async (): Promise<void> => {
    if (!currentRequest) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const request = await confirmBackupEmergencyAccessRequest(currentRequest.id);
      const effective = effectiveRequest(request);
      setCurrentRequest(effective);
      setHandover(null);
      if (effective && shouldFetchHandover(effective)) {
        await loadHandover(effective);
      }
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [currentRequest, loadHandover]);

  const denyBackupReview = useCallback(async (): Promise<void> => {
    if (!currentRequest) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const request = await denyBackupEmergencyAccessRequest(currentRequest.id);
      setCurrentRequest(effectiveRequest(request));
      setHandover(null);
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [currentRequest]);

  const selectAssignment = useCallback(
    async (assignmentId: string): Promise<void> => {
      const selected = assignments.find((assignment) => assignment.id === assignmentId) ?? null;
      selectedAssignmentIdRef.current = assignmentId;
      setSelectedAssignmentId(assignmentId);
      setCurrentRequest(effectiveRequest(selected?.latestRequest ?? null));
      setHandover(null);
      if (selected?.latestRequest && shouldFetchHandover(effectiveRequest(selected.latestRequest))) {
        await loadHandover(selected.latestRequest);
      }
    },
    [assignments, loadHandover]
  );

  return {
    assignments,
    selectedAssignment,
    currentRequest,
    handover,
    loading,
    handoverLoading,
    submitting,
    error,
    refresh,
    selectAssignment,
    requestAccess,
    bindInviteToken,
    closeAccess,
    confirmBackupReview,
    denyBackupReview
  };
}
