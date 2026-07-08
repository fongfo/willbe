import type { Locale } from './locales';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatReply = {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
  }>;
};

type ChatApiResponse = {
  success: boolean;
  data?: {
    answer?: unknown;
    sources?: unknown;
  };
  error?: unknown;
};

const defaultAiApiBaseUrl = 'http://localhost:4200/api';

function getAiApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_AI_API_BASE_URL ?? defaultAiApiBaseUrl).replace(/\/$/, '');
}

function parseSources(value: unknown): ChatReply['sources'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const source = item as Record<string, unknown>;
    if (typeof source.title !== 'string' || typeof source.category !== 'string') {
      return [];
    }

    return [{ title: source.title, category: source.category }];
  });
}

export async function requestAiSupportReply(message: string, locale: Locale, history: ChatMessage[]): Promise<ChatReply> {
  const response = await fetch(`${getAiApiBaseUrl()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      locale,
      history: history.slice(-6)
    })
  });

  const payload = (await response.json()) as ChatApiResponse;

  if (!response.ok || !payload.success || !payload.data || typeof payload.data.answer !== 'string') {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'AI support is unavailable');
  }

  return {
    answer: payload.data.answer,
    sources: parseSources(payload.data.sources)
  };
}
