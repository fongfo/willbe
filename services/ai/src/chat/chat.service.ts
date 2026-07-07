import { KnowledgeService } from '../knowledge/knowledge.service';
import { LlmClient } from './llm.client';
import {
  ChatCitation,
  ChatReplyRequest,
  ChatReplyResponse
} from './chat.types';

const RAG_LIMIT = 4;

function toCitation(result: {
  readonly id: string;
  readonly title: string;
  readonly score: number;
  readonly source: { readonly document: string; readonly section: string };
}): ChatCitation {
  return {
    id: result.id,
    title: result.title,
    score: result.score,
    source: { ...result.source }
  };
}

export class ChatService {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly llmClient: LlmClient
  ) {}

  async reply(request: ChatReplyRequest): Promise<ChatReplyResponse> {
    const search = this.knowledgeService.search({
      query: request.message,
      locale: request.locale,
      limit: RAG_LIMIT
    });
    const completion = await this.llmClient.complete({
      userMessage: request.message,
      history: request.history ?? [],
      context: search.results,
      answerPolicy: search.answerPolicy
    });

    return {
      message: completion.content,
      citations: search.results.map(toCitation),
      disclaimerRequired: search.answerPolicy.disclaimerRequired,
      answerPolicy: search.answerPolicy,
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
