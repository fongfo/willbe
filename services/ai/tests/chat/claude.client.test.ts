import { AnthropicClaudeClient, createClaudeClientFromEnv, MissingClaudeClient } from '../../src/chat/claude.client';
import { HttpError } from '../../src/shared/http-error';

describe('Claude clients', () => {
  const baseRequest = {
    userMessage: 'How do I add trusted contacts?',
    history: [{ role: 'assistant' as const, content: 'I can help with Pusaka product guidance.' }],
    context: [
      {
        id: 'faq-trusted-contacts-why-two',
        title: 'Why Pusaka recommends two trusted contacts',
        category: 'FAQ' as const,
        locale: 'en' as const,
        content: 'Two trusted contacts provide a primary and backup route.',
        tags: ['trusted contacts'],
        source: { document: 'project/PRD.md', section: '4. AI customer support' },
        disclaimerRequired: false,
        updatedAt: '2026-06-22',
        score: 12,
        highlights: ['Two trusted contacts provide a primary and backup route.']
      }
    ],
    answerPolicy: {
      responseMode: 'grounded_rag_context_only' as const,
      disclaimerRequired: false,
      prohibitedAdvice: ['financial', 'legal', 'insurance'] as const
    }
  };

  it('calls the Anthropic Messages gateway with grounded context and history', async () => {
    const calls: unknown[] = [];
    const client = new AnthropicClaudeClient({
      apiKey: 'test-key',
      model: 'claude-test',
      maxTokens: 123,
      messages: {
        async create(params) {
          calls.push(params);
          return {
            content: [{ type: 'text', text: 'Grounded answer.', citations: null }],
            model: 'claude-test',
            stop_reason: 'end_turn',
            usage: { input_tokens: 10, output_tokens: 5 }
          };
        }
      }
    });

    const response = await client.complete(baseRequest);

    expect(response).toEqual({
      content: 'Grounded answer.',
      provider: 'anthropic',
      model: 'claude-test',
      stopReason: 'end_turn',
      inputTokens: 10,
      outputTokens: 5
    });
    expect(JSON.stringify(calls[0])).toContain('faq-trusted-contacts-why-two');
    expect(JSON.stringify(calls[0])).toContain('financial, legal or insurance advice');
    expect(JSON.stringify(calls[0])).toContain('I can help with Pusaka product guidance.');
  });

  it('uses the insufficient-context fallback when Claude returns no text', async () => {
    const client = new AnthropicClaudeClient({
      apiKey: 'test-key',
      messages: {
        async create() {
          return {
            content: [],
            model: 'claude-test',
            stop_reason: null,
            usage: { input_tokens: 1, output_tokens: 0 }
          };
        }
      }
    });

    const response = await client.complete({ ...baseRequest, context: [] });

    expect(response.content).toContain('not have enough Pusaka knowledge base context');
    expect(response.stopReason).toBeUndefined();
  });

  it('returns a configured 503 provider error when Claude is missing', async () => {
    await expect(new MissingClaudeClient().complete(baseRequest)).rejects.toEqual(
      new HttpError(503, 'Anthropic provider is not configured')
    );
  });

  it('creates the missing provider from env when no API key is set', async () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await expect(createClaudeClientFromEnv().complete(baseRequest)).rejects.toEqual(
        new HttpError(503, 'Anthropic provider is not configured')
      );
    } finally {
      if (previousKey) {
        process.env.ANTHROPIC_API_KEY = previousKey;
      }
    }
  });

  it('creates a configured provider from env without requiring max token overrides', async () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    const previousModel = process.env.ANTHROPIC_MODEL;
    const previousMaxTokens = process.env.ANTHROPIC_MAX_TOKENS;
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.ANTHROPIC_MODEL = 'claude-env';
    delete process.env.ANTHROPIC_MAX_TOKENS;

    try {
      expect(createClaudeClientFromEnv()).toHaveProperty('complete');
    } finally {
      if (previousKey) {
        process.env.ANTHROPIC_API_KEY = previousKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
      if (previousModel) {
        process.env.ANTHROPIC_MODEL = previousModel;
      } else {
        delete process.env.ANTHROPIC_MODEL;
      }
      if (previousMaxTokens) {
        process.env.ANTHROPIC_MAX_TOKENS = previousMaxTokens;
      } else {
        delete process.env.ANTHROPIC_MAX_TOKENS;
      }
    }
  });

  it('rejects invalid max token env configuration safely', () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    const previousMaxTokens = process.env.ANTHROPIC_MAX_TOKENS;
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.ANTHROPIC_MAX_TOKENS = 'not-a-number';

    try {
      expect(() => createClaudeClientFromEnv()).toThrow(
        new HttpError(503, 'Anthropic provider is misconfigured')
      );
    } finally {
      if (previousKey) {
        process.env.ANTHROPIC_API_KEY = previousKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
      if (previousMaxTokens) {
        process.env.ANTHROPIC_MAX_TOKENS = previousMaxTokens;
      } else {
        delete process.env.ANTHROPIC_MAX_TOKENS;
      }
    }
  });
});
