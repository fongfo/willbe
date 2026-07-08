import type { Metadata } from 'next';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getPageContent, type PageContent } from '@/lib/content';
import { defaultLocale, type Locale } from '@/lib/locales';

import { AiSupportWidget } from './AiSupportWidget';
import { Section } from './Section';

type PageScaffoldProps = {
  locale: Locale;
  page: string;
  path: string;
};

export function createMetadata(locale: Locale, page: string): Metadata {
  const content = getPageContent(locale, page);

  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: {
      canonical: locale === defaultLocale ? `/${page === 'home' ? '' : page}` : `/${locale}${page === 'home' ? '' : `/${page}`}`,
      languages: {
        en: `/${page === 'home' ? '' : page}`,
        zh: `/zh${page === 'home' ? '' : `/${page}`}`
      }
    },
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      type: 'website'
    }
  };
}

export function PageScaffold({ locale, page, path }: PageScaffoldProps): React.ReactElement {
  const content = getPageContent<PageContent>(locale, page);
  const title = content.seo.title.replace(/ \| Pusaka$/, '');

  return (
    <div className="page-shell">
      <Header locale={locale} path={path} />
      <main>
        <section className="page-intro">
          <div className="container">
            <p className="eyebrow">Pusaka</p>
            <h1>{title}</h1>
            <p>{content.seo.description}</p>
          </div>
        </section>
        {content.sections.map((section, index) => (
          <Section key={section.title} section={section} variant={index === 0 ? 'cards' : 'timeline'} />
        ))}
      </main>
      <AiSupportWidget locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}
