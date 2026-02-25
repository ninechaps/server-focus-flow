import PageContainer from '@/components/layout/page-container';
import { ApiLogsListing } from '@/features/admin/components/api-logs-listing';

export const metadata = {
  title: 'Admin: API Logs'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='API Access Logs'
      pageDescription='View and filter API access logs by source, status, and date.'
    >
      <ApiLogsListing />
    </PageContainer>
  );
}
