'use client';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { useState } from 'react';
import { CellAction } from './cell-action';
import { SOURCE_OPTIONS, USER_TYPE_OPTIONS } from './options';
import { apiClient } from '@/lib/api-client';

export interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  registrationSource: string;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  totalOnlineTime: number | null;
  roles: string[];
  userType: string;
  clientLoginEnabled: boolean;
}

const USER_TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  client: 'secondary',
  admin: 'default',
  both: 'outline'
};

function ClientLoginSwitch({
  userId,
  initialEnabled
}: {
  userId: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    setLoading(true);
    try {
      const res = await apiClient(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientLoginEnabled: checked })
      });
      if (res.ok) {
        setEnabled(checked);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Switch
      checked={enabled}
      onCheckedChange={handleToggle}
      disabled={loading}
      aria-label='Toggle client login'
    />
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function createColumns(
  canAssignRoles: boolean,
  t: (key: string) => string
): ColumnDef<AdminUser>[] {
  return [
    {
      id: 'email',
      accessorKey: 'email',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('email')} />
      ),
      cell: ({ cell }) => (
        <div className='max-w-[200px] truncate'>{cell.getValue<string>()}</div>
      ),
      meta: {
        label: t('email'),
        placeholder: t('emailPlaceholder'),
        variant: 'text' as const,
        icon: Text
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'username',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('username')} />
      ),
      cell: ({ cell }) => <div>{cell.getValue<string | null>() ?? '-'}</div>
    },
    {
      id: 'registrationSource',
      accessorKey: 'registrationSource',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('source')} />
      ),
      cell: ({ cell }) => {
        const source = cell.getValue<string>();
        return (
          <Badge variant='outline' className='uppercase'>
            {source}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t('source'),
        variant: 'multiSelect' as const,
        options: SOURCE_OPTIONS
      }
    },
    {
      id: 'userType',
      accessorKey: 'userType',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('userType')} />
      ),
      cell: ({ cell }) => {
        const type = cell.getValue<string>();
        return (
          <Badge
            variant={USER_TYPE_VARIANT[type] ?? 'outline'}
            className='capitalize'
          >
            {type}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t('userType'),
        variant: 'multiSelect' as const,
        options: USER_TYPE_OPTIONS
      }
    },
    {
      id: 'clientLoginEnabled',
      accessorKey: 'clientLoginEnabled',
      header: t('clientAccess'),
      cell: ({ row }) => (
        <ClientLoginSwitch
          userId={row.original.id}
          initialEnabled={row.original.clientLoginEnabled}
        />
      )
    },
    {
      accessorKey: 'roles',
      header: t('roles'),
      cell: ({ cell }) => {
        const roles = cell.getValue<string[]>();
        return (
          <div className='flex gap-1'>
            {roles.map((role) => (
              <Badge key={role} variant='secondary' className='text-xs'>
                {role}
              </Badge>
            ))}
            {roles.length === 0 && (
              <span className='text-muted-foreground text-xs'>-</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('registered')} />
      ),
      cell: ({ cell }) => (
        <div className='text-sm'>
          {formatDate(cell.getValue<Date | null>())}
        </div>
      )
    },
    {
      accessorKey: 'lastLoginAt',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('lastLogin')} />
      ),
      cell: ({ cell }) => (
        <div className='text-sm'>
          {formatDate(cell.getValue<Date | null>())}
        </div>
      )
    },
    {
      accessorKey: 'totalOnlineTime',
      header: t('onlineTime'),
      cell: ({ cell }) => (
        <div className='text-sm'>
          {formatDuration(cell.getValue<number | null>())}
        </div>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <CellAction data={row.original} canAssignRoles={canAssignRoles} />
      )
    }
  ];
}
