export const locales = ['en', 'zh'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  zh: '中文'
};

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'zh';
}

export function normalizeLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function localizePath(locale: Locale, path: string): string {
  const normalizedPath = path === '/' ? '' : path;
  return locale === defaultLocale ? `/${normalizedPath}`.replace('//', '/') : `/${locale}${normalizedPath}`;
}

export function getAlternatePath(currentLocale: Locale, targetLocale: Locale, path: string): string {
  const cleanPath = path.replace(/^\/zh/, '') || '/';
  return localizePath(targetLocale, currentLocale === 'zh' ? cleanPath : path);
}
