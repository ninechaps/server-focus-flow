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
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLock
} from '@tabler/icons-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RoleFormDialog } from '../role-form-dialog';
import type { AdminRole } from './columns';

const SYSTEM_ROLES = ['owner'];

interface CellActionProps {
  data: AdminRole;
  allPermissions: { id: string; code: string }[];
}

export function CellAction({ data, allPermissions }: CellActionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const isSystem = SYSTEM_ROLES.includes(data.name);

  if (isSystem) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='text-muted-foreground flex h-8 w-8 items-center justify-center'>
            <IconLock className='h-4 w-4' />
          </span>
        </TooltipTrigger>
        <TooltipContent>System role — cannot be modified</TooltipContent>
      </Tooltip>
    );
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete role "${data.name}"?`))
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/roles/${data.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to delete role');
      }
      toast.success(`Role "${data.name}" deleted`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <RoleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        role={data}
        allPermissions={allPermissions}
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
