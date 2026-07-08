import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Section } from '@/components/Section';
import { TrustStrip } from '@/components/TrustStrip';
import { getPageContent } from '@/lib/content';
import type { Locale } from '@/lib/locales';

import { AiSupportWidget } from './AiSupportWidget';

type HomePageProps = {
  locale: Locale;
  path: string;
};

const trustItems = {
  en: ['No passwords or private keys', 'Malaysia-first compliance review', 'AI guidance with advice boundaries', 'Emergency handover preview'],
  zh: ['不保存密码或私钥', '马来西亚优先合规审查', '有边界的 AI 指引', '紧急移交预览']
} as const;

export function HomePage({ locale, path }: HomePageProps): React.ReactElement {
  const content = getPageContent(locale, 'home');

  if (!content.hero) {
    throw new Error('Home page hero content is required');
  }

  return (
    <div className="page-shell">
      <Header locale={locale} path={path} />
      <main>
        <Hero content={content.hero} locale={locale} />
        <TrustStrip items={[...trustItems[locale]]} />
        {content.sections.map((section, index) => (
          <Section key={section.title} section={section} variant={index === 0 ? 'cards' : 'timeline'} />
        ))}
        <PreviewPanel locale={locale} />
      </main>
      <AiSupportWidget locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}
