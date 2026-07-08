import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;

    return React.createElement('img', { alt, src: String(src), ...props });
  }
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));
