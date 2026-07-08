import { getCommonContent } from '@/lib/content';
import type { Locale } from '@/lib/locales';

type PreviewPanelProps = {
  locale: Locale;
};

const copy = {
  en: {
    title: 'Sample readiness preview',
    body: 'Illustrative metadata only. No real asset values, passwords, private keys, or account numbers.',
    gaps: ['Backup trusted contact missing', 'AIA policy folder location not reviewed', 'Emergency preview not shared']
  },
  zh: {
    title: '准备度预览示例',
    body: '仅使用示例元数据。不展示真实资产价值、密码、私钥或账号。',
    gaps: ['缺少备用信任联系人', 'AIA 保单文件夹位置尚未复核', '紧急预览尚未分享']
  }
} as const;

export function PreviewPanel({ locale }: PreviewPanelProps): React.ReactElement {
  const common = getCommonContent(locale);
  const localizedCopy = copy[locale];

  return (
    <section className="section">
      <div className="container">
        <div className="preview-panel">
          <div className="score" aria-label="Readiness score 72 percent">
            <div>
              <strong>72%</strong>
              <p>{localizedCopy.title}</p>
            </div>
          </div>
          <div>
            <h2>{localizedCopy.title}</h2>
            <p>{localizedCopy.body}</p>
            <ul className="content-list">
              {localizedCopy.gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
            <p className="disclaimer">{common.compliance}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
