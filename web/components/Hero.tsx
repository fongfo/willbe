import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';

import type { PageContent } from '@/lib/content';
import { localizePath, type Locale } from '@/lib/locales';

type HeroProps = {
  content: NonNullable<PageContent['hero']>;
  locale: Locale;
};

export function Hero({ content, locale }: HeroProps): React.ReactElement {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.body}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={localizePath(locale, '/how-it-works')}>
              {content.primaryCta}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button button-secondary" href={localizePath(locale, '/how-it-works')}>
              <PlayCircle size={18} aria-hidden="true" />
              {content.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <Image
            src="/images/hero-family-planning.png"
            alt="Family reviewing a practical handover checklist at home"
            width={1536}
            height={864}
            priority
          />
          <div className="hero-note">{content.note}</div>
        </div>
      </div>
    </section>
  );
}
