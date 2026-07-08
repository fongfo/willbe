import { createMetadata, PageScaffold } from '@/components/PageScaffold';

export const metadata = createMetadata('en', 'security');

export default function Page(): React.ReactElement {
  return <PageScaffold locale="en" page="security" path="/security" />;
}
