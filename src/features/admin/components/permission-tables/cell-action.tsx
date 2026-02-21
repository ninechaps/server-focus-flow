'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PermissionFormDialog } from '../permission-form-dialog';
import type { AdminPermission } from './columns';

interface CellActionProps {
  data: AdminPermission;
}

export function CellAction({ data }: CellActionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete permission "${data.code}"?`))
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/permissions/${data.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to delete permission');
      }
      toast.success(`Permission "${data.code}" deleted`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PermissionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        permission={data}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <IconEdit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deleting}
            className='text-destructive'
          >
            <IconTrash className='mr-2 h-4 w-4' />
            {deleting ? 'Deleting...' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
