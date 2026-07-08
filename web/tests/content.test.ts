import { describe, expect, it } from 'vitest';

import { getCommonContent, getPageContent, type FaqContent } from '@/lib/content';
import { getAlternatePath, localizePath, locales } from '@/lib/locales';

describe('localized content', () => {
  it('loads every WB-27 page for each supported locale', () => {
    const pages = ['home', 'how-it-works', 'security', 'ai-support', 'faq'];

    for (const locale of locales) {
      expect(getCommonContent(locale).compliance).toBeTruthy();

      for (const page of pages) {
        expect(getPageContent(locale, page).seo.title).toBeTruthy();
      }
    }
  });

  it('keeps regulated-advice disclaimer on AI support content', () => {
    expect(getCommonContent('en').compliance).toContain('does not provide financial, legal, or insurance advice');
    expect(getCommonContent('zh').compliance).toContain('不提供金融、法律或保险建议');
  });

  it('provides FAQ groups for later structured data', () => {
    const faq = getPageContent<FaqContent>('en', 'faq');

    expect(faq.groups).toHaveLength(3);
    expect(faq.groups.flatMap((group) => group.items).length).toBeGreaterThanOrEqual(8);
  });
});

describe('locale routing', () => {
  it('maps default locale to root paths and Chinese to /zh paths', () => {
    expect(localizePath('en', '/security')).toBe('/security');
    expect(localizePath('zh', '/security')).toBe('/zh/security');
    expect(localizePath('en', '/')).toBe('/');
    expect(localizePath('zh', '/')).toBe('/zh');
  });

  it('switches between localized route equivalents', () => {
    expect(getAlternatePath('en', 'zh', '/faq')).toBe('/zh/faq');
    expect(getAlternatePath('zh', 'en', '/zh/faq')).toBe('/faq');
  });
});
