import { GapExplanationService } from '../../src/gap-explanations/gap-explanations.service';
import { GapExplanationRequest } from '../../src/gap-explanations/gap-explanations.types';

describe('GapExplanationService', () => {
  const request: GapExplanationRequest = {
    locale: 'en',
    score: 40,
    level: 'needs-work',
    gaps: [
      {
        id: 'asset-references',
        category: 'asset_references',
        title: 'Add an asset reference',
        detail: 'Record where your family should look without storing sensitive numbers.',
        severity: 'high',
        priority: 40,
        action: { label: 'Add asset reference', route: '/asset-references' },
        evidence: { current: 0, required: 1, unit: 'asset reference' }
      },
      {
        id: 'trusted-contacts-count',
        category: 'trusted_contacts',
        title: 'Add two trusted contacts',
        detail: 'Two contacts avoids a single point of failure during an emergency.',
        severity: 'high',
        priority: 20,
        action: { label: 'Add trusted contact', route: '/trusted-contacts' },
        evidence: { current: 1, required: 2, unit: 'trusted contacts' }
      }
    ]
  };

  it('turns structured gaps into prioritized LLM-backed recommendations', async () => {
    const calls: unknown[] = [];
    const service = new GapExplanationService({
      async completePrompt(input) {
        calls.push(input);
        return {
          content: JSON.stringify({
            summary: 'Focus first on the missing trusted contact, then make assets easier to locate.',
            recommendations: [
              {
                gapId: 'asset-references',
                urgency: 'do_next',
                explanation: 'An asset reference gives your family a starting point without storing account numbers.',
                nextActionLabel: 'Add asset reference'
              },
              {
                gapId: 'trusted-contacts-count',
                urgency: 'do_first',
                explanation: 'A second contact creates a backup path if the first person is unavailable.',
                nextActionLabel: 'Add trusted contact'
              }
            ]
          }),
          provider: 'deepseek',
          model: 'deepseek-v4-flash',
          stopReason: 'end_turn',
          inputTokens: 55,
          outputTokens: 42
        };
      }
    });

    const response = await service.explain(request);

    expect(response.summary).toContain('trusted contact');
    expect(response.recommendations.map((item) => item.gapId)).toEqual([
      'trusted-contacts-count',
      'asset-references'
    ]);
    expect(response.recommendations[0]).toEqual(
      expect.objectContaining({
        category: 'trusted_contacts',
        priority: 20,
        urgency: 'do_first',
        nextAction: { label: 'Add trusted contact', route: '/trusted-contacts' }
      })
    );
    expect(response.answerPolicy.prohibitedAdvice).toEqual(['financial', 'legal', 'insurance']);
    expect(response.provider).toEqual(expect.objectContaining({ name: 'deepseek' }));
    expect(JSON.stringify(calls)).not.toContain('locationHint');
  });

  it('uses deterministic fallback when the model returns invalid JSON', async () => {
    const service = new GapExplanationService({
      async completePrompt() {
        return {
          content: 'not json',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest'
        };
      }
    });

    const response = await service.explain(request);

    expect(response.provider.name).toBe('fallback');
    expect(response.recommendations.map((item) => item.gapId)).toEqual([
      'trusted-contacts-count',
      'asset-references'
    ]);
  });

  it('does not call the model when there are no open gaps', async () => {
    let calls = 0;
    const service = new GapExplanationService({
      async completePrompt() {
        calls += 1;
        return { content: '{}', provider: 'anthropic', model: 'unused' };
      }
    });

    const response = await service.explain({ locale: 'en', score: 100, level: 'ready', gaps: [] });

    expect(calls).toBe(0);
    expect(response.summary).toContain('no open gaps');
    expect(response.recommendations).toEqual([]);
  });

  it('falls back when the model omits a requested gap', async () => {
    const service = new GapExplanationService({
      async completePrompt() {
        return {
          content: JSON.stringify({
            summary: 'Only one recommendation.',
            recommendations: [
              {
                gapId: 'trusted-contacts-count',
                urgency: 'do_first',
                explanation: 'Add one more trusted contact.',
                nextActionLabel: 'Add trusted contact'
              }
            ]
          }),
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest'
        };
      }
    });

    const response = await service.explain(request);

    expect(response.provider.name).toBe('fallback');
    expect(response.recommendations).toHaveLength(2);
  });

  it('falls back when the model provider throws', async () => {
    const service = new GapExplanationService({
      async completePrompt() {
        throw new Error('provider timeout');
      }
    });

    const response = await service.explain(request);

    expect(response.provider.name).toBe('fallback');
    expect(response.summary).toContain('highest-priority');
  });

  it('uses deterministic fallback when the model crosses advice boundaries', async () => {
    const service = new GapExplanationService({
      async completePrompt() {
        return {
          content: JSON.stringify({
            summary: 'This is legal advice: draft a will today.',
            recommendations: [
              {
                gapId: 'trusted-contacts-count',
                urgency: 'do_first',
                explanation: 'Hire a lawyer and buy this policy.',
                nextActionLabel: 'Add trusted contact'
              },
              {
                gapId: 'asset-references',
                urgency: 'do_next',
                explanation: 'Add product data.',
                nextActionLabel: 'Add asset reference'
              }
            ]
          }),
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest'
        };
      }
    });

    const response = await service.explain(request);

    expect(response.provider.name).toBe('fallback');
    expect(JSON.stringify(response)).not.toContain('Hire a lawyer');
  });
});
