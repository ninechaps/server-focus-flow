'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { RoleFormDialog } from '../role-form-dialog';
import { RoleUsersSheet } from '../role-users-sheet';
import { createColumns, type AdminRole } from './columns';

interface RoleTableProps {
  data: AdminRole[];
  totalItems: number;
  allPermissions: { id: string; code: string }[];
}

export function RoleTable({
  data,
  totalItems,
  allPermissions
}: RoleTableProps) {
  const tCols = useTranslations('admin.roles.columns');
  const tForm = useTranslations('admin.roles.form');
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  const columns = useMemo(
    () =>
      createColumns(allPermissions, {
        onViewUsers: setSelectedRole,
        t: tCols
      }),
    [allPermissions, tCols]
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
      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        allPermissions={allPermissions}
      />
      {selectedRole && (
        <RoleUsersSheet
          open={!!selectedRole}
          onOpenChange={(open) => !open && setSelectedRole(null)}
          roleId={selectedRole.id}
          roleName={selectedRole.name}
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
