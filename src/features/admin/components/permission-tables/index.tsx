'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { PermissionFormDialog } from '../permission-form-dialog';
import { PermissionRolesSheet } from '../permission-roles-sheet';
import { createColumns, type AdminPermission } from './columns';

interface PermissionTableProps {
  data: AdminPermission[];
  totalItems: number;
}

export function PermissionTable({ data, totalItems }: PermissionTableProps) {
  const tCols = useTranslations('admin.permissions.columns');
  const tForm = useTranslations('admin.permissions.form');
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<AdminPermission | null>(null);

  const columns = useMemo(
    () => createColumns({ onViewRoles: setSelectedPermission, t: tCols }),
    [tCols]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <>
      <PermissionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      {selectedPermission && (
        <PermissionRolesSheet
          open={!!selectedPermission}
          onOpenChange={(open) => !open && setSelectedPermission(null)}
          permissionId={selectedPermission.id}
          permissionCode={selectedPermission.code}
        />
      )}
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Button size='sm' onClick={() => setDialogOpen(true)}>
            <IconPlus className='mr-1 h-4 w-4' />
            {tForm('addTitle')}
          </Button>
        </DataTableToolbar>
      </DataTable>
    </>
  );
}
