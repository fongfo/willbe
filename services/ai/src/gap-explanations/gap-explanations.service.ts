import { PromptLlmClient } from '../chat/llm.client';
import {
  GapExplanationRequest,
  GapExplanationResponse,
  GapInput,
  GapRecommendation,
  GapUrgency
} from './gap-explanations.types';
import { llmGapExplanationSchema } from './gap-explanations.schema';

const PROHIBITED_TERMS = [
  'legal advice',
  'financial advice',
  'insurance advice',
  'hire a lawyer',
  'buy this',
  'invest in',
  'purchase insurance',
  'draft a will'
] as const;

interface ParsedGapRecommendation {
  readonly gapId: string;
  readonly urgency: GapUrgency;
  readonly explanation: string;
  readonly nextActionLabel: string;
}

function urgencyFor(index: number): GapUrgency {
  if (index === 0) {
    return 'do_first';
  }
  if (index <= 2) {
    return 'do_next';
  }
  return 'do_later';
}

function sanitizeGap(gap: GapInput): Record<string, unknown> {
  return {
    id: gap.id,
    category: gap.category,
    title: gap.title,
    severity: gap.severity,
    priority: gap.priority,
    action: gap.action,
    evidence: gap.evidence
  };
}

function buildSystemPrompt(locale: GapExplanationRequest['locale']): string {
  return [
    'You explain Pusaka readiness gaps for a family resilience planning product.',
    'Return JSON only with keys: summary and recommendations.',
    'Each recommendation must include gapId, urgency, explanation and nextActionLabel.',
    'Use the supplied priority order. Do not invent new gaps, providers, documents or routes.',
    'Do not provide financial, legal or insurance advice. Do not draft legal documents.',
    'Keep guidance practical, product-oriented and safe for Malaysia-first family planning.',
    `Preferred response language: ${locale ?? 'en'}.`
  ].join('\n');
}

function buildUserMessage(request: GapExplanationRequest): string {
  return JSON.stringify({
    score: request.score,
    level: request.level,
    gaps: sortGaps(request.gaps).map(sanitizeGap)
  });
}

function sortGaps(gaps: readonly GapInput[]): GapInput[] {
  return [...gaps].sort((left, right) => left.priority - right.priority);
}

function extractJsonObject(content: string): unknown {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('LLM response did not contain JSON');
  }
  return JSON.parse(content.slice(start, end + 1));
}

function containsProhibitedAdvice(text: string): boolean {
  const normalized = text.toLowerCase();
  return PROHIBITED_TERMS.some((term) => normalized.includes(term));
}

function fallbackSummary(request: GapExplanationRequest): string {
  if (request.gaps.length === 0) {
    return 'Your readiness plan has no open gaps from the current checks.';
  }
  return 'Work through the highest-priority readiness gaps first so your family has a clearer emergency handover path.';
}

function fallbackRecommendation(gap: GapInput, index: number): GapRecommendation {
  return {
    gapId: gap.id,
    category: gap.category,
    priority: gap.priority,
    urgency: urgencyFor(index),
    title: gap.title,
    explanation: gap.detail,
    nextAction: { ...gap.action }
  };
}

function fallbackResponse(request: GapExplanationRequest): GapExplanationResponse {
  return {
    summary: fallbackSummary(request),
    recommendations: sortGaps(request.gaps).map(fallbackRecommendation),
    disclaimerRequired: true,
    answerPolicy: {
      responseMode: 'structured_gap_explanation_only',
      prohibitedAdvice: ['financial', 'legal', 'insurance']
    },
    provider: { name: 'fallback', model: 'deterministic-gap-explainer' }
  };
}

function toRecommendation(
  gapById: ReadonlyMap<string, GapInput>,
  item: ParsedGapRecommendation
): GapRecommendation | undefined {
  const gap = gapById.get(item.gapId);
  if (!gap) {
    return undefined;
  }
  return {
    gapId: gap.id,
    category: gap.category,
    priority: gap.priority,
    urgency: item.urgency,
    title: gap.title,
    explanation: item.explanation,
    nextAction: { label: item.nextActionLabel, route: gap.action.route }
  };
}

function buildRecommendations(
  gaps: readonly GapInput[],
  parsedRecommendations: readonly ParsedGapRecommendation[]
): GapRecommendation[] {
  const gapById = new Map(gaps.map((gap) => [gap.id, gap]));
  return parsedRecommendations
    .map((item) => toRecommendation(gapById, item))
    .filter((item): item is GapRecommendation => Boolean(item))
    .sort((left, right) => left.priority - right.priority);
}

export class GapExplanationService {
  constructor(private readonly llmClient: PromptLlmClient) {}

  async explain(request: GapExplanationRequest): Promise<GapExplanationResponse> {
    if (request.gaps.length === 0) {
      return fallbackResponse(request);
    }

    try {
      const completion = await this.llmClient.completePrompt({
        systemPrompt: buildSystemPrompt(request.locale),
        userMessage: buildUserMessage(request)
      });
      return this.toResponse(request, completion);
    } catch {
      return fallbackResponse(request);
    }
  }

  private toResponse(
    request: GapExplanationRequest,
    completion: Awaited<ReturnType<PromptLlmClient['completePrompt']>>
  ): GapExplanationResponse {
    const parsed = llmGapExplanationSchema.parse(extractJsonObject(completion.content));
    const orderedGaps = sortGaps(request.gaps);

    if (containsProhibitedAdvice(`${parsed.summary} ${JSON.stringify(parsed.recommendations)}`)) {
      return fallbackResponse(request);
    }

    const recommendations = buildRecommendations(orderedGaps, parsed.recommendations);

    if (recommendations.length !== orderedGaps.length) {
      return fallbackResponse(request);
    }

    return {
      summary: parsed.summary,
      recommendations,
      disclaimerRequired: true,
      answerPolicy: {
        responseMode: 'structured_gap_explanation_only',
        prohibitedAdvice: ['financial', 'legal', 'insurance']
      },
      provider: {
        name: completion.provider,
        model: completion.model,
        stopReason: completion.stopReason,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens
      }
    };
  }
}
