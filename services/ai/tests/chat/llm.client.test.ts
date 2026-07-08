import {
  AnthropicCompatibleLlmClient,
  createLlmClientFromEnv,
  MissingLlmClient
} from '../../src/chat/llm.client';
import { HttpError } from '../../src/shared/http-error';

describe('LLM provider clients', () => {
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

  it('returns DeepSeek metadata when using an Anthropic-compatible DeepSeek gateway', async () => {
    const calls: unknown[] = [];
    const client = new AnthropicCompatibleLlmClient({
      provider: 'deepseek',
      apiKey: 'test-key',
      baseURL: 'https://api.deepseek.com/anthropic',
      model: 'deepseek-v4-flash',
      maxTokens: 321,
      messages: {
        async create(params) {
          calls.push(params);
          return {
            content: [{ type: 'text', text: 'DeepSeek grounded answer.', citations: null }],
            model: 'deepseek-v4-flash',
            stop_reason: 'end_turn',
            usage: { input_tokens: 11, output_tokens: 6 }
          };
        }
      }
    });

    const response = await client.complete(baseRequest);

    expect(response.provider).toBe('deepseek');
    expect(response.model).toBe('deepseek-v4-flash');
    expect(response.content).toBe('DeepSeek grounded answer.');
    expect(JSON.stringify(calls[0])).toContain('faq-trusted-contacts-why-two');
  });

  it('supports custom prompt completions for structured AI tasks', async () => {
    const calls: unknown[] = [];
    const client = new AnthropicCompatibleLlmClient({
      provider: 'anthropic',
      apiKey: 'test-key',
      model: 'claude-structured',
      messages: {
        async create(params) {
          calls.push(params);
          return {
            content: [{ type: 'text', text: '{"summary":"ok","recommendations":[]}', citations: null }],
            model: 'claude-structured',
            stop_reason: null,
            usage: { input_tokens: 7, output_tokens: 3 }
          };
        }
      }
    });

    const response = await client.completePrompt({
      systemPrompt: 'Return JSON only.',
      userMessage: '{"gaps":[]}'
    });

    expect(response.content).toContain('"summary"');
    expect(response.stopReason).toBeUndefined();
    expect(calls[0]).toEqual(
      expect.objectContaining({
        system: 'Return JSON only.',
        messages: [{ role: 'user', content: '{"gaps":[]}' }]
      })
    );
  });

  it('selects DeepSeek from env without leaking the API key', () => {
    const previous = snapshotEnv();
    process.env.AI_PROVIDER = 'deepseek';
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.DEEPSEEK_MODEL = 'deepseek-v4-flash';
    process.env.DEEPSEEK_MAX_TOKENS = '450';

    try {
      const client = createLlmClientFromEnv();

      expect(client).toBeInstanceOf(AnthropicCompatibleLlmClient);
      expect(JSON.stringify(client)).not.toContain('test-deepseek-key');
    } finally {
      restoreEnv(previous);
    }
  });

  it('rejects missing DeepSeek keys and invalid provider names safely', async () => {
    const previous = snapshotEnv();
    process.env.AI_PROVIDER = 'deepseek';
    delete process.env.DEEPSEEK_API_KEY;

    try {
      await expect(createLlmClientFromEnv().complete(baseRequest)).rejects.toEqual(
        new HttpError(503, 'DeepSeek provider is not configured')
      );
      process.env.AI_PROVIDER = 'unknown';
      expect(() => createLlmClientFromEnv()).toThrow(
        new HttpError(503, 'AI provider is misconfigured')
      );
    } finally {
      restoreEnv(previous);
    }
  });

  it('keeps Anthropic as the default provider', async () => {
    const previous = snapshotEnv();
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await expect(createLlmClientFromEnv().complete(baseRequest)).rejects.toEqual(
        new HttpError(503, 'Anthropic provider is not configured')
      );
      await expect(new MissingLlmClient('deepseek').complete(baseRequest)).rejects.toEqual(
        new HttpError(503, 'DeepSeek provider is not configured')
      );
    } finally {
      restoreEnv(previous);
    }
  });
});

function snapshotEnv(): NodeJS.ProcessEnv {
  return { ...process.env };
}

function restoreEnv(previous: NodeJS.ProcessEnv): void {
  process.env.AI_PROVIDER = previous.AI_PROVIDER;
  process.env.ANTHROPIC_API_KEY = previous.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_MODEL = previous.ANTHROPIC_MODEL;
  process.env.ANTHROPIC_MAX_TOKENS = previous.ANTHROPIC_MAX_TOKENS;
  process.env.DEEPSEEK_API_KEY = previous.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_BASE_URL = previous.DEEPSEEK_BASE_URL;
  process.env.DEEPSEEK_MODEL = previous.DEEPSEEK_MODEL;
  process.env.DEEPSEEK_MAX_TOKENS = previous.DEEPSEEK_MAX_TOKENS;
}
