import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import UserListingPage from '@/features/admin/components/user-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Users'
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='User Management'
      pageDescription='View and manage all registered users.'
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={8} rowCount={10} filterCount={2} />
        }
      >
        <UserListingPage />
      </Suspense>
    </PageContainer>
  );
}
