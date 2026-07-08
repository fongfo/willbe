import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pusaka.willbe.local'),
  title: {
    default: 'Pusaka',
    template: '%s'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
