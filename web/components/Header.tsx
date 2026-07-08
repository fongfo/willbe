import Link from 'next/link';

import { getCommonContent } from '@/lib/content';
import { localizePath, type Locale } from '@/lib/locales';

import { LocaleSwitcher } from './LocaleSwitcher';

type HeaderProps = {
  locale: Locale;
  path: string;
};

export function Header({ locale, path }: HeaderProps): React.ReactElement {
  const common = getCommonContent(locale);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="wordmark" href={localizePath(locale, '/')}>
          <span className="wordmark-mark" aria-hidden="true">
            P
          </span>
          <span>Pusaka</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {common.nav.links.map((item) => (
            <Link key={item.href} href={localizePath(locale, item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <LocaleSwitcher locale={locale} path={path} />
          <Link className="button button-primary" href={localizePath(locale, '/how-it-works')}>
            {common.nav.start}
          </Link>
        </div>
      </div>
    </header>
  );
}
