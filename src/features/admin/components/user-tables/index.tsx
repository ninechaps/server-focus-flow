'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { createColumns, type AdminUser } from './columns';

interface UserTableProps {
  data: AdminUser[];
  totalItems: number;
  canAssignRoles: boolean;
}

export function UserTable({
  data,
  totalItems,
  canAssignRoles
}: UserTableProps) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);

  const columns = useMemo(
    () => createColumns(canAssignRoles),
    [canAssignRoles]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
