import { notFound } from 'next/navigation';

import { createMetadata, PageScaffold } from '@/components/PageScaffold';
import { isLocale, type Locale } from '@/lib/locales';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return createMetadata(locale, 'security');
}

export default async function Page({ params }: Props): Promise<React.ReactElement> {
  const { locale } = await params;

  if (!isLocale(locale) || locale === 'en') {
    notFound();
  }

  return <PageScaffold locale={locale as Locale} page="security" path={`/${locale}/security`} />;
}
