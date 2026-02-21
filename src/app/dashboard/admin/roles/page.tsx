import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import RoleListingPage from '@/features/admin/components/role-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Roles'
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
      pageTitle='Role Management'
      pageDescription='Create and manage roles, assign permissions to each role.'
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={5} rowCount={10} filterCount={1} />
        }
      >
        <RoleListingPage />
      </Suspense>
    </PageContainer>
  );
}
