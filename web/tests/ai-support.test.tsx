import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiSupportWidget } from '@/components/AiSupportWidget';
import { requestAiSupportReply } from '@/lib/ai-support';

describe('AI support API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts localized chat requests to the AI service', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          answer: 'Use safe references only.',
          sources: [{ title: 'Security boundary', category: 'security' }]
        }
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const reply = await requestAiSupportReply('What should I add?', 'en', [{ role: 'assistant', content: 'Hello' }]);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4200/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What should I add?',
          locale: 'en',
          history: [{ role: 'assistant', content: 'Hello' }]
        })
      })
    );
    expect(reply.answer).toBe('Use safe references only.');
    expect(reply.sources).toEqual([{ title: 'Security boundary', category: 'security' }]);
  });

  it('throws a safe error when AI service response is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Rate limit exceeded' })
      })
    );

    await expect(requestAiSupportReply('Help', 'en', [])).rejects.toThrow('Rate limit exceeded');
  });
});

describe('AiSupportWidget', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the chat panel with compliance boundary copy', () => {
    render(<AiSupportWidget locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'Open AI support' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Pusaka AI' })).toBeInTheDocument();
    expect(screen.getByText(/does not provide financial, legal, or insurance advice/i)).toBeInTheDocument();
  });

  it('sends a visitor question and renders the assistant reply', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            answer: 'Add provider names and document locations, not secrets.',
            sources: []
          }
        })
      })
    );

    render(<AiSupportWidget locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'Open AI support' }));
    fireEvent.change(screen.getByLabelText('Ask about trusted contacts or asset references'), {
      target: { value: 'What should I write for an asset reference?' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('What should I write for an asset reference?')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Add provider names and document locations, not secrets.')).toBeInTheDocument();
    });
  });
});
