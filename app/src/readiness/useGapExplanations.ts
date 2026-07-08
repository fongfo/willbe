import { useEffect, useState } from 'react';
import { explainGaps } from './gapExplanations.api';
import type {
  GapExplanationRequest,
  GapExplanationResponse
} from './gapExplanations.types';
import type { ReadinessEvaluation } from './evaluateReadiness';

interface GapExplanationState {
  readonly data: GapExplanationResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

interface StoredGapExplanationState {
  readonly requestKey: string | null;
  readonly data: GapExplanationResponse | null;
  readonly error: string | null;
}

function toRequest(evaluation: ReadinessEvaluation): GapExplanationRequest {
  return {
    locale: 'en',
    score: evaluation.score,
    level: evaluation.level,
    gaps: evaluation.gaps.map((gap) => ({
      id: gap.id,
      category: gap.category,
      title: gap.title,
      detail: gap.detail,
      severity: gap.severity,
      priority: gap.priority,
      action: { ...gap.action },
      evidence: { ...gap.evidence }
    }))
  };
}

export function useGapExplanations(
  evaluation: ReadinessEvaluation,
  enabled: boolean
): GapExplanationState {
  const requestKey = JSON.stringify(toRequest(evaluation));
  const [state, setState] = useState<StoredGapExplanationState>({
    requestKey: null,
    data: null,
    error: null
  });

  useEffect(() => {
    const requestPayload = JSON.parse(requestKey) as GapExplanationRequest;

    if (!enabled || requestPayload.gaps.length === 0) {
      return undefined;
    }

    const controller = new AbortController();

    explainGaps(requestPayload, controller.signal)
      .then((data) => setState({ requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          requestKey,
          data: null,
          error: error instanceof Error ? error.message : 'Gap explanation unavailable'
        });
      });

    return () => controller.abort();
  }, [enabled, requestKey]);

  const requestPayload = JSON.parse(requestKey) as GapExplanationRequest;
  const hasGaps = requestPayload.gaps.length > 0;
  const current = state.requestKey === requestKey;

  return {
    data: current ? state.data : null,
    loading: enabled && hasGaps && !current,
    error: current ? state.error : null
  };
}
