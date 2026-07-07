import { getAiApiBaseUrl, request } from '../api';
import { chatReplyResponseSchema } from './chat.schema';
import type { ChatReplyRequest, ChatReplyResponse } from './chat.types';

const RESOURCE = '/chat';

export async function sendChatMessage(
  input: ChatReplyRequest,
  signal?: AbortSignal
): Promise<ChatReplyResponse> {
  const data = await request<unknown>(RESOURCE, {
    method: 'POST',
    body: input,
    signal,
    baseUrl: getAiApiBaseUrl()
  });
  const parsed = chatReplyResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Chat reply was not recognised');
  }

  return parsed.data;
}
