import { notFound } from 'next/navigation';

import { FaqPage } from '@/components/FaqPage';
import { createMetadata } from '@/components/PageScaffold';
import { isLocale, type Locale } from '@/lib/locales';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return createMetadata(locale, 'faq');
}

export default async function Page({ params }: Props): Promise<React.ReactElement> {
  const { locale } = await params;

  if (!isLocale(locale) || locale === 'en') {
    notFound();
  }

  return <FaqPage locale={locale as Locale} path={`/${locale}/faq`} />;
}
