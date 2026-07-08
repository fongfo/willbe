import { icons } from './Icons';

type TrustStripProps = {
  items: string[];
};

const stripIcons = [icons.lock, icons.shield, icons.ai, icons.checklist];

export function TrustStrip({ items }: TrustStripProps): React.ReactElement {
  return (
    <div className="container trust-strip" aria-label="Trust highlights">
      {items.map((item, index) => {
        const Icon = stripIcons[index] ?? icons.check;

        return (
          <div className="trust-item" key={item}>
            <span className="icon-pill">
              <Icon size={21} aria-hidden="true" />
            </span>
            <span>{item}</span>
          </div>
        );
      })}
    </div>
  );
}
