import {
  AnswerPolicy,
  KnowledgeEntry,
  KnowledgeListFilters,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeSearchResult
} from './knowledge.types';
import { KnowledgeRepository } from './knowledge.repository';

const DEFAULT_LIMIT = 5;
const PROHIBITED_ADVICE = ['financial', 'legal', 'insurance'] as const;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): readonly string[] {
  const matches = normalize(value).match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) ?? [];
  return [...new Set(matches.filter((token) => token.length > 1))];
}

function entryText(entry: KnowledgeEntry): string {
  return normalize(`${entry.title} ${entry.content} ${entry.tags.join(' ')}`);
}

function scoreEntry(entry: KnowledgeEntry, query: string, terms: readonly string[]): number {
  const text = entryText(entry);
  const title = normalize(entry.title);
  const tags = normalize(entry.tags.join(' '));
  const phrase = normalize(query);
  const phraseScore = text.includes(phrase) ? 20 : 0;

  return terms.reduce((score, term) => {
    if (!text.includes(term)) {
      return score;
    }
    const titleScore = title.includes(term) ? 6 : 0;
    const tagScore = tags.includes(term) ? 4 : 0;
    return score + 2 + titleScore + tagScore;
  }, phraseScore);
}

function buildHighlights(entry: KnowledgeEntry, terms: readonly string[]): readonly string[] {
  const sentences = entry.content.split(/(?<=[.!?])\s+/);
  const highlights = sentences.filter((sentence) => {
    const normalizedSentence = normalize(sentence);
    return terms.some((term) => normalizedSentence.includes(term));
  });
  return (highlights.length > 0 ? highlights : [entry.content]).slice(0, 2);
}

function buildPolicy(results: readonly KnowledgeSearchResult[]): AnswerPolicy {
  return {
    responseMode: 'grounded_rag_context_only',
    disclaimerRequired: results.some((result) => result.disclaimerRequired),
    prohibitedAdvice: PROHIBITED_ADVICE
  };
}

export class KnowledgeService {
  constructor(private readonly repository: KnowledgeRepository) {}

  list(filters: KnowledgeListFilters = {}): readonly KnowledgeEntry[] {
    return this.repository.list(filters);
  }

  search(request: KnowledgeSearchRequest): KnowledgeSearchResponse {
    const terms = tokenize(request.query);
    const limit = request.limit ?? DEFAULT_LIMIT;
    const results = this.repository
      .list({ category: request.category, locale: request.locale })
      .map((entry) => this.scoreResult(entry, request.query, terms))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, limit);

    return { query: request.query, results, answerPolicy: buildPolicy(results) };
  }

  private scoreResult(
    entry: KnowledgeEntry,
    query: string,
    terms: readonly string[]
  ): KnowledgeSearchResult {
    return {
      ...entry,
      tags: [...entry.tags],
      source: { ...entry.source },
      score: scoreEntry(entry, query, terms),
      highlights: buildHighlights(entry, terms)
    };
  }
}
