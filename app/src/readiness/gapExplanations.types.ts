import type {
  GapCategory,
  GapSeverity,
  ReadinessActionRoute,
  ReadinessLevel
} from './evaluateReadiness';

export type GapUrgency = 'do_first' | 'do_next' | 'do_later';

export interface GapExplanationInput {
  readonly id: string;
  readonly category: GapCategory;
  readonly title: string;
  readonly detail: string;
  readonly severity: GapSeverity;
  readonly priority: number;
  readonly action: {
    readonly label: string;
    readonly route: ReadinessActionRoute;
  };
  readonly evidence: {
    readonly current: number;
    readonly required: number;
    readonly unit: string;
  };
}

export interface GapExplanationRequest {
  readonly locale?: 'en' | 'zh' | 'ms';
  readonly score: number;
  readonly level: ReadinessLevel;
  readonly gaps: readonly GapExplanationInput[];
}

export interface GapRecommendation {
  readonly gapId: string;
  readonly category: GapCategory;
  readonly priority: number;
  readonly urgency: GapUrgency;
  readonly title: string;
  readonly explanation: string;
  readonly nextAction: {
    readonly label: string;
    readonly route: ReadinessActionRoute;
  };
}

export interface GapExplanationResponse {
  readonly summary: string;
  readonly recommendations: readonly GapRecommendation[];
  readonly disclaimerRequired: boolean;
  readonly answerPolicy: {
    readonly responseMode: 'structured_gap_explanation_only';
    readonly prohibitedAdvice: readonly ['financial', 'legal', 'insurance'];
  };
  readonly provider: {
    readonly name: 'anthropic' | 'deepseek' | 'fallback';
    readonly model: string;
    readonly stopReason?: string;
    readonly inputTokens?: number;
    readonly outputTokens?: number;
  };
}
