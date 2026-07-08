import type { PageContent } from '@/lib/content';

type SectionProps = {
  section: PageContent['sections'][number];
  variant?: 'cards' | 'timeline';
};

export function Section({ section, variant = 'cards' }: SectionProps): React.ReactElement {
  const gridClassName = variant === 'timeline' ? 'flow-grid' : 'card-grid';

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          {section.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
          <h2>{section.title}</h2>
          {section.body ? <p>{section.body}</p> : null}
        </div>
        {section.items ? (
          <div className={gridClassName}>
            {section.items.map((item) => (
              <article className={variant === 'timeline' ? 'timeline-item' : 'card'} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
