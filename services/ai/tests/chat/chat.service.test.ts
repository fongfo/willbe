import { ChatService } from '../../src/chat/chat.service';
import { LlmClient } from '../../src/chat/llm.client';
import { seedKnowledgeEntries } from '../../src/knowledge/knowledge.seed';
import { InMemoryKnowledgeRepository } from '../../src/knowledge/knowledge.repository';
import { KnowledgeService } from '../../src/knowledge/knowledge.service';

describe('ChatService', () => {
  function buildService(client: LlmClient): ChatService {
    return new ChatService(
      new KnowledgeService(new InMemoryKnowledgeRepository(seedKnowledgeEntries)),
      client
    );
  }

  it('grounds support replies in RAG context and returns source citations', async () => {
    const calls: unknown[] = [];
    const service = buildService({
      async complete(request) {
        calls.push(request);
        return {
          content: 'Add a primary and backup trusted contact so your family has a fallback path.',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest',
          stopReason: 'end_turn',
          inputTokens: 120,
          outputTokens: 32
        };
      }
    });

    const response = await service.reply({
      message: 'Why do I need two trusted contacts?',
      locale: 'en'
    });

    expect(response.message).toContain('trusted contact');
    expect(response.citations[0]).toEqual(
      expect.objectContaining({
        id: 'faq-trusted-contacts-why-two',
        source: expect.objectContaining({ document: 'project/PRD.md' })
      })
    );
    expect(response.answerPolicy.responseMode).toBe('grounded_rag_context_only');
    expect(response.provider).toEqual(expect.objectContaining({ name: 'anthropic' }));
    expect(JSON.stringify(calls)).toContain('faq-trusted-contacts-why-two');
  });

  it('adds disclaimer metadata when context touches regulated advice boundaries', async () => {
    const service = buildService({
      async complete() {
        return {
          content: 'I can explain the product boundary, but this is not legal, financial or insurance advice.',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest',
          stopReason: 'end_turn'
        };
      }
    });

    const response = await service.reply({
      message: 'Can you give legal advice about Malaysia PDPA and Claude API?',
      locale: 'en'
    });

    expect(response.disclaimerRequired).toBe(true);
    expect(response.answerPolicy.prohibitedAdvice).toEqual(['financial', 'legal', 'insurance']);
  });

  it('uses a safe fallback when the knowledge base has no context', async () => {
    const service = buildService({
      async complete(request) {
        expect(request.context).toEqual([]);
        return {
          content: 'I do not have enough Pusaka knowledge base context to answer that.',
          provider: 'deepseek',
          model: 'claude-3-5-sonnet-latest',
          stopReason: 'end_turn'
        };
      }
    });

    const response = await service.reply({ message: 'zzzz qqqq' });

    expect(response.citations).toEqual([]);
    expect(response.message).toContain('not have enough');
  });
});
