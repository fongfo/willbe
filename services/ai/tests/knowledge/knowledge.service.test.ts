import { seedKnowledgeEntries } from '../../src/knowledge/knowledge.seed';
import { InMemoryKnowledgeRepository } from '../../src/knowledge/knowledge.repository';
import { KnowledgeService } from '../../src/knowledge/knowledge.service';

describe('KnowledgeService', () => {
  const service = new KnowledgeService(new InMemoryKnowledgeRepository(seedKnowledgeEntries));

  it('searches product docs and ranks grounded onboarding guidance first', () => {
    const results = service.search({
      query: 'how to add trusted contacts for emergency handoff',
      limit: 3
    });

    expect(results.results[0]?.id).toBe('faq-trusted-contacts-why-two');
    expect(results.results[0]?.category).toBe('FAQ');
    expect(results.results[0]?.highlights.join(' ')).toContain('trusted contacts');
    expect(results.answerPolicy.responseMode).toBe('grounded_rag_context_only');
  });

  it('returns regulatory summaries with disclaimers for PDPA and advice boundaries', () => {
    const results = service.search({
      query: 'Malaysia PDPA cross border transfer Claude API legal advice',
      category: 'REGULATORY_SUMMARY',
      limit: 5
    });

    expect(results.results.length).toBeGreaterThanOrEqual(2);
    expect(results.results.every((result) => result.category === 'REGULATORY_SUMMARY')).toBe(true);
    expect(results.answerPolicy.disclaimerRequired).toBe(true);
    expect(results.answerPolicy.prohibitedAdvice).toEqual(['financial', 'legal', 'insurance']);
  });

  it('lists entries by locale and category without mutating the seed data', () => {
    const faqEntries = service.list({ category: 'FAQ', locale: 'en' });

    expect(faqEntries.length).toBeGreaterThanOrEqual(3);
    expect(faqEntries.every((entry) => entry.category === 'FAQ')).toBe(true);
    expect(faqEntries.every((entry) => entry.locale === 'en')).toBe(true);
    expect(faqEntries[0]?.tags).not.toBe(seedKnowledgeEntries[0]?.tags);
  });

  it('returns no context and no disclaimer when a query has no matches', () => {
    const results = service.search({ query: 'zzzz qqqq' });

    expect(results.results).toEqual([]);
    expect(results.answerPolicy.disclaimerRequired).toBe(false);
  });
});
