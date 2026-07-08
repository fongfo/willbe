import { FaqPage } from '@/components/FaqPage';
import { createMetadata } from '@/components/PageScaffold';

export const metadata = createMetadata('en', 'faq');

export default function Page(): React.ReactElement {
  return <FaqPage locale="en" path="/faq" />;
}
