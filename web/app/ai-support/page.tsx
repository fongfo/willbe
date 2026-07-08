import { createMetadata, PageScaffold } from '@/components/PageScaffold';

export const metadata = createMetadata('en', 'ai-support');

export default function Page(): React.ReactElement {
  return <PageScaffold locale="en" page="ai-support" path="/ai-support" />;
}
