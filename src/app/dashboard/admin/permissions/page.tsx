import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PermissionListingPage from '@/features/admin/components/permission-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Permissions'
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
      pageTitle='Permission Management'
      pageDescription='Create and manage permissions that can be assigned to roles.'
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={5} rowCount={10} filterCount={1} />
        }
      >
        <PermissionListingPage />
      </Suspense>
    </PageContainer>
  );
}
