import { request } from '../src/api';
import { sendChatMessage } from '../src/ai-assistant/chat.api';
import type { ChatReplyResponse } from '../src/ai-assistant/chat.types';

jest.mock('../src/api', () => ({
  getAiApiBaseUrl: () => 'http://localhost:4200/api',
  request: jest.fn()
}));

const mockedRequest = request as jest.Mock;

const reply: ChatReplyResponse = {
  message: 'Add two trusted contacts so your family has a backup.',
  citations: [
    {
      id: 'trusted-contacts',
      title: 'Trusted contacts',
      source: { document: 'FAQ', section: 'Setup' },
      score: 0.9
    }
  ],
  disclaimerRequired: true,
  answerPolicy: {
    responseMode: 'grounded_rag_context_only',
    disclaimerRequired: true,
    prohibitedAdvice: ['financial', 'legal', 'insurance']
  },
  provider: {
    name: 'deepseek',
    model: 'deepseek-v4-flash',
    stopReason: 'end_turn'
  }
};

afterEach(() => jest.clearAllMocks());

describe('sendChatMessage', () => {
  it('posts a chat request and validates the reply envelope data', async () => {
    mockedRequest.mockResolvedValue(reply);

    await expect(sendChatMessage({ message: 'Why two contacts?' })).resolves.toEqual(
      reply
    );
    expect(mockedRequest).toHaveBeenCalledWith(
      '/chat',
      expect.objectContaining({
        method: 'POST',
        body: { message: 'Why two contacts?' },
        baseUrl: 'http://localhost:4200/api'
      })
    );
  });

  it('throws when the reply shape is not recognised', async () => {
    mockedRequest.mockResolvedValue({ message: '' });

    await expect(sendChatMessage({ message: 'hello' })).rejects.toThrow(
      'not recognised'
    );
  });
});
