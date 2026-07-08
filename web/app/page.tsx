import { HomePage } from '@/components/HomePage';
import { createMetadata } from '@/components/PageScaffold';

export const metadata = createMetadata('en', 'home');

export default function Page(): React.ReactElement {
  return <HomePage locale="en" path="/" />;
}
