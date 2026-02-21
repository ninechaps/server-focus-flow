'use client';
import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { UserSessionDetail } from './user-session-detail';

export interface UserSessionSummary {
  userId: string;
  email: string;
  username: string | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  isOnline: boolean;
  sessionCount: number;
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

const columns: ColumnDef<UserSessionSummary>[] = [
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.email}</span>
        {row.original.username && (
          <span className='text-muted-foreground text-xs'>
            @{row.original.username}
          </span>
        )}
      </div>
    )
  },
  {
    accessorKey: 'isOnline',
    header: 'Status',
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5'>
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            row.original.isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
          }`}
        />
        <Badge
          variant={row.original.isOnline ? 'default' : 'secondary'}
          className='text-xs'
        >
          {row.original.isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>
    )
  },
  {
    accessorKey: 'lastLoginAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Login' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{formatDate(row.original.lastLoginAt)}</span>
    )
  },
  {
    accessorKey: 'lastLoginIp',
    header: 'Last IP',
    cell: ({ row }) => (
      <span className='font-mono text-sm'>
        {row.original.lastLoginIp ?? '-'}
      </span>
    )
  },
  {
    accessorKey: 'sessionCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sessions' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline' className='text-xs'>
        {row.original.sessionCount}
      </Badge>
    )
  }
];

interface UserSessionTableProps {
  data: UserSessionSummary[];
}

export function UserSessionTable({ data }: UserSessionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'lastLoginAt', desc: true }
  ]);
  const [selectedUser, setSelectedUser] = useState<UserSessionSummary | null>(
    null
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <>
      <UserSessionDetail
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        userId={selectedUser?.userId ?? ''}
        userEmail={selectedUser?.email ?? ''}
      />

      <div className='rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-muted-foreground h-24 text-center'
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='cursor-pointer'
                  onClick={() => setSelectedUser(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
