import { useCallback, useState } from 'react';
import { ApiError } from '../api';
import { sendChatMessage } from './chat.api';
import type { ChatMessage, ChatReplyResponse } from './chat.types';

const HISTORY_LIMIT = 8;

interface UseAiAssistantResult {
  messages: ChatMessage[];
  latestReply: ChatReplyResponse | null;
  sending: boolean;
  error: string | null;
  send: (message: string) => Promise<void>;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

function historyForRequest(messages: readonly ChatMessage[]): ChatMessage[] {
  return messages.slice(-HISTORY_LIMIT);
}

export function useAiAssistant(): UseAiAssistantResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi, I can help with Pusaka setup, trusted contacts, readiness gaps, and emergency handover basics.'
    }
  ]);
  const [latestReply, setLatestReply] = useState<ChatReplyResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (rawMessage: string): Promise<void> => {
      const message = rawMessage.trim();
      if (!message || sending) {
        return;
      }

      const userMessage: ChatMessage = { role: 'user', content: message };
      const requestHistory = historyForRequest(messages);
      setMessages((current) => [...current, userMessage]);
      setSending(true);
      setError(null);

      try {
        const reply = await sendChatMessage({
          message,
          locale: 'en',
          history: requestHistory
        });
        setLatestReply(reply);
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: reply.message }
        ]);
      } catch (err: unknown) {
        setError(toMessage(err));
      } finally {
        setSending(false);
      }
    },
    [messages, sending]
  );

  return { messages, latestReply, sending, error, send };
}
