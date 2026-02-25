'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';

export interface AdminPermission {
  id: string;
  code: string;
  description: string | null;
  roleCount: number;
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
  onViewRoles: (permission: AdminPermission) => void;
  t: (key: string) => string;
}

export function createColumns({
  onViewRoles,
  t
}: CreateColumnsOptions): ColumnDef<AdminPermission>[] {
  return [
    {
      id: 'code',
      accessorKey: 'code',
      header: ({ column }: { column: Column<AdminPermission, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('code')} />
      ),
      cell: ({ cell }) => (
        <div className='font-mono font-medium'>{cell.getValue<string>()}</div>
      ),
      meta: {
        label: t('code'),
        placeholder: t('codePlaceholder'),
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
      accessorKey: 'roleCount',
      header: t('roles'),
      cell: ({ row }) => {
        const count = row.original.roleCount;
        return (
          <button
            onClick={() => onViewRoles(row.original)}
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
      header: ({ column }: { column: Column<AdminPermission, unknown> }) => (
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
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
}
