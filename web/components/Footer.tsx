import Link from 'next/link';

import { getCommonContent } from '@/lib/content';
import { localeLabels, localizePath, locales, type Locale } from '@/lib/locales';

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps): React.ReactElement {
  const common = getCommonContent(locale);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h2>Pusaka</h2>
          <p>{common.footer.tagline}</p>
        </div>
        <div>
          <h3>{common.footer.product}</h3>
          <Link href={localizePath(locale, '/how-it-works')}>{common.nav.links[0].label}</Link>
          <Link href={localizePath(locale, '/ai-support')}>{common.nav.links[2].label}</Link>
        </div>
        <div>
          <h3>{common.footer.trust}</h3>
          <Link href={localizePath(locale, '/security')}>{common.nav.links[1].label}</Link>
          <Link href={localizePath(locale, '/faq')}>{common.nav.links[3].label}</Link>
        </div>
        <div>
          <h3>{common.footer.languages}</h3>
          {locales.map((targetLocale) => (
            <Link key={targetLocale} href={localizePath(targetLocale, '/')}>
              {localeLabels[targetLocale]}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
