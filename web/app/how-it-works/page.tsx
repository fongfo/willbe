import { createMetadata, PageScaffold } from '@/components/PageScaffold';

export const metadata = createMetadata('en', 'how-it-works');

export default function Page(): React.ReactElement {
  return <PageScaffold locale="en" page="how-it-works" path="/how-it-works" />;
}
