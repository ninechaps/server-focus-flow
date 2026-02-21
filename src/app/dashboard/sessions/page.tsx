import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import AdminSessionListing from '@/features/sessions/components/admin-session-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Sessions'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Sessions'
      pageDescription='View all user login sessions. Click a row to see details.'
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={5} rowCount={10} filterCount={0} />
        }
      >
        <AdminSessionListing />
      </Suspense>
    </PageContainer>
  );
}
