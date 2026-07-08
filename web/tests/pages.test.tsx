import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FaqPage } from '@/components/FaqPage';
import { HomePage } from '@/components/HomePage';
import { PageScaffold } from '@/components/PageScaffold';

describe('WB-27 website pages', () => {
  it('renders the English homepage with hero image, trust strip, and readiness preview', () => {
    render(<HomePage locale="en" path="/" />);

    expect(screen.getByRole('heading', { level: 1, name: /Pusaka helps your family/i })).toBeInTheDocument();
    expect(screen.getByAltText(/Family reviewing a practical handover checklist/i)).toBeInTheDocument();
    expect(screen.getByText('No passwords or private keys')).toBeInTheDocument();
    expect(screen.getByText(/does not provide financial, legal, or insurance advice/i)).toBeInTheDocument();
  });

  it('renders the Chinese homepage and localized navigation', () => {
    render(<HomePage locale="zh" path="/zh" />);

    expect(screen.getByRole('heading', { level: 1, name: /Pusaka 帮助家人/ })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('link', { name: '安全与隐私' })).toHaveAttribute(
      'href',
      '/zh/security'
    );
    expect(screen.getByText('不保存密码或私钥')).toBeInTheDocument();
  });

  it('renders security page with sensitive-data boundaries', () => {
    render(<PageScaffold locale="en" page="security" path="/security" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Security and privacy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'References, not secrets.' })).toBeInTheDocument();
    expect(screen.getByText(/passwords, private keys, bank account numbers/i)).toBeInTheDocument();
    expect(screen.getByText(/Future proof-of-plan anchoring stores hashes only/i)).toBeInTheDocument();
  });

  it('renders FAQ questions and compliance disclaimer', () => {
    render(<FaqPage locale="en" path="/faq" />);

    expect(screen.getByRole('heading', { level: 1, name: 'FAQ' })).toBeInTheDocument();
    expect(screen.getByText('Should I add passwords?')).toBeInTheDocument();
    expect(screen.getByText(/Pusaka AI provides product guidance/i)).toBeInTheDocument();
  });
});
