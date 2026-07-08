'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageCircle, Send, X } from 'lucide-react';

import { requestAiSupportReply, type ChatMessage } from '@/lib/ai-support';
import { getCommonContent } from '@/lib/content';
import type { Locale } from '@/lib/locales';

type AiSupportWidgetProps = {
  locale: Locale;
};

const localizedCopy = {
  en: {
    launcher: 'Ask Pusaka AI',
    title: 'Pusaka AI',
    subtitle: 'Product setup help with clear advice boundaries.',
    placeholder: 'Ask about trusted contacts or asset references',
    send: 'Send message',
    close: 'Close AI support',
    open: 'Open AI support',
    error: 'AI support is unavailable. Please try again later.',
    empty: 'Ask a setup question in plain language.',
    examples: ['Why do I need two trusted contacts?', 'What should I write for an asset reference?']
  },
  zh: {
    launcher: '询问 Pusaka AI',
    title: 'Pusaka AI',
    subtitle: '有清晰边界的产品设置帮助。',
    placeholder: '询问信任联系人或资产线索',
    send: '发送消息',
    close: '关闭 AI 客服',
    open: '打开 AI 客服',
    error: 'AI 客服暂时不可用，请稍后再试。',
    empty: '用平实语言询问设置问题。',
    examples: ['为什么需要两个信任联系人？', '资产线索应该怎么写？']
  }
} as const;

export function AiSupportWidget({ locale }: AiSupportWidgetProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const common = getCommonContent(locale);
  const copy = localizedCopy[locale];

  const canSend = input.trim().length > 0 && !isSending;
  const visibleMessages = useMemo(() => messages.slice(-6), [messages]);

  function openWidget(): void {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmedInput }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const reply = await requestAiSupportReply(trimmedInput, locale, messages);
      setMessages([...nextMessages, { role: 'assistant', content: reply.answer }]);
    } catch {
      setError(copy.error);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <aside className="ai-widget" aria-label={copy.title}>
      {isOpen ? (
        <section className="ai-panel" aria-live="polite">
          <div className="ai-panel-header">
            <span className="icon-pill">
              <Bot size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{copy.title}</h2>
              <p>{copy.subtitle}</p>
            </div>
            <button className="ai-icon-button" type="button" aria-label={copy.close} onClick={() => setIsOpen(false)}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="ai-disclaimer">{common.compliance}</p>
          <div className="ai-messages">
            {visibleMessages.length === 0 ? (
              <div className="ai-empty">
                <p>{copy.empty}</p>
                {copy.examples.map((example) => (
                  <button key={example} type="button" onClick={() => setInput(example)}>
                    {example}
                  </button>
                ))}
              </div>
            ) : (
              visibleMessages.map((message, index) => (
                <div className={`ai-message ai-message-${message.role}`} key={`${message.role}-${index}-${message.content}`}>
                  {message.content}
                </div>
              ))
            )}
            {isSending ? (
              <div className="ai-message ai-message-assistant ai-loading">
                <LoaderCircle size={16} aria-hidden="true" />
                {copy.title}
              </div>
            ) : null}
            {error ? <p className="ai-error">{error}</p> : null}
          </div>
          <form className="ai-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="ai-support-message">
              {copy.placeholder}
            </label>
            <input
              id="ai-support-message"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={copy.placeholder}
              maxLength={800}
            />
            <button className="ai-send-button" type="submit" disabled={!canSend} aria-label={copy.send}>
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
      ) : (
        <button className="ai-launcher" type="button" aria-label={copy.open} onClick={openWidget}>
          <MessageCircle size={20} aria-hidden="true" />
          <span>{copy.launcher}</span>
        </button>
      )}
    </aside>
  );
}
