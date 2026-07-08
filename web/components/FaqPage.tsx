import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getCommonContent, getPageContent, type FaqContent } from '@/lib/content';
import type { Locale } from '@/lib/locales';

type FaqPageProps = {
  locale: Locale;
  path: string;
};

export function FaqPage({ locale, path }: FaqPageProps): React.ReactElement {
  const content = getPageContent<FaqContent>(locale, 'faq');
  const common = getCommonContent(locale);
  const title = content.seo.title.replace(/ \| Pusaka$/, '');

  return (
    <div className="page-shell">
      <Header locale={locale} path={path} />
      <main className="section">
        <div className="container">
          <div className="section-header">
            <p className="eyebrow">FAQ</p>
            <h1>{title}</h1>
            <p>{content.seo.description}</p>
          </div>
          <div className="faq-grid">
            {content.groups.flatMap((group) =>
              group.items.map((item) => (
                <article className="faq-item" key={`${group.title}-${item.question}`}>
                  <p className="eyebrow">{group.title}</p>
                  <h2>{item.question}</h2>
                  <p>{item.answer}</p>
                </article>
              ))
            )}
          </div>
          <p className="disclaimer">{common.compliance}</p>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
