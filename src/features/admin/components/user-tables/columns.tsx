'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { SOURCE_OPTIONS } from './options';

export interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  registrationSource: string;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  totalOnlineTime: number | null;
  roles: string[];
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

export function createColumns(canAssignRoles: boolean): ColumnDef<AdminUser>[] {
  return [
    {
      id: 'email',
      accessorKey: 'email',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title='Email' />
      ),
      cell: ({ cell }) => (
        <div className='max-w-[200px] truncate'>{cell.getValue<string>()}</div>
      ),
      meta: {
        label: 'Email',
        placeholder: 'Search by email...',
        variant: 'text' as const,
        icon: Text
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'username',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title='Username' />
      ),
      cell: ({ cell }) => <div>{cell.getValue<string | null>() ?? '-'}</div>
    },
    {
      id: 'registrationSource',
      accessorKey: 'registrationSource',
      header: ({ column }: { column: Column<AdminUser, unknown> }) => (
        <DataTableColumnHeader column={column} title='Source' />
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
        label: 'Source',
        variant: 'multiSelect' as const,
        options: SOURCE_OPTIONS
      }
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
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
        <DataTableColumnHeader column={column} title='Registered' />
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
        <DataTableColumnHeader column={column} title='Last Login' />
      ),
      cell: ({ cell }) => (
        <div className='text-sm'>
          {formatDate(cell.getValue<Date | null>())}
        </div>
      )
    },
    {
      accessorKey: 'totalOnlineTime',
      header: 'Online Time',
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
