'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';

import { useDataTable } from '@/hooks/use-data-table';
import { useProductColumns } from './columns';

import { parseAsInteger, useQueryState } from 'nuqs';
interface ProductTableParams<TData> {
  data: TData[];
  totalItems: number;
}
export function ProductTable<TData>({
  data,
  totalItems
}: ProductTableParams<TData>) {
  const columns = useProductColumns() as never[];
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false, //Setting to false triggers a network request with the updated querystring.
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
