'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';

const SYSTEM_ROLES = ['owner'];

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  createdAt: Date | null;
}

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

interface CreateColumnsOptions {
  onViewUsers: (role: AdminRole) => void;
  t: (key: string) => string;
}

export function createColumns(
  allPermissions: { id: string; code: string }[],
  { onViewUsers, t }: CreateColumnsOptions
): ColumnDef<AdminRole>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }: { column: Column<AdminRole, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('name')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{row.original.name}</span>
          {SYSTEM_ROLES.includes(row.original.name) && (
            <Badge variant='outline' className='text-xs'>
              {t('systemBadge')}
            </Badge>
          )}
        </div>
      ),
      meta: {
        label: t('name'),
        placeholder: t('namePlaceholder'),
        variant: 'text' as const,
        icon: Text
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ cell }) => (
        <div className='text-muted-foreground max-w-[300px] truncate text-sm'>
          {cell.getValue<string | null>() ?? '-'}
        </div>
      )
    },
    {
      accessorKey: 'permissions',
      header: t('permissions'),
      cell: ({ cell }) => {
        const perms = cell.getValue<string[]>();
        return (
          <div className='flex max-w-[400px] flex-wrap gap-1'>
            {perms.map((p) => (
              <Badge key={p} variant='secondary' className='text-xs'>
                {p}
              </Badge>
            ))}
            {perms.length === 0 && (
              <span className='text-muted-foreground text-xs'>-</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'userCount',
      header: t('userCount'),
      cell: ({ row }) => {
        const count = row.original.userCount;
        return (
          <button
            onClick={() => onViewUsers(row.original)}
            disabled={count === 0}
          >
            <Badge
              variant={count > 0 ? 'secondary' : 'outline'}
              className={
                count > 0
                  ? 'hover:bg-secondary/80 cursor-pointer text-xs'
                  : 'text-xs'
              }
            >
              {count}
            </Badge>
          </button>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }: { column: Column<AdminRole, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('createdAt')} />
      ),
      cell: ({ cell }) => (
        <div className='text-sm'>
          {formatDate(cell.getValue<Date | null>())}
        </div>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <CellAction data={row.original} allPermissions={allPermissions} />
      )
    }
  ];
}
