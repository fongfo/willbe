import Link from 'next/link';

import { getAlternatePath, localeLabels, locales, type Locale } from '@/lib/locales';

type LocaleSwitcherProps = {
  locale: Locale;
  path: string;
};

export function LocaleSwitcher({ locale, path }: LocaleSwitcherProps): React.ReactElement {
  return (
    <nav className="language-switcher" aria-label="Language">
      {locales.map((targetLocale) => (
        <Link
          key={targetLocale}
          href={getAlternatePath(locale, targetLocale, path)}
          aria-current={targetLocale === locale ? 'true' : undefined}
        >
          {localeLabels[targetLocale]}
        </Link>
      ))}
    </nav>
  );
}
