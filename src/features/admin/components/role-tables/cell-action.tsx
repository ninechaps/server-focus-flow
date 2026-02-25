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
import { useTranslations } from 'next-intl';
import { RoleFormDialog } from '../role-form-dialog';
import type { AdminRole } from './columns';
import { apiClient } from '@/lib/api-client';

const SYSTEM_ROLES = ['owner'];

interface CellActionProps {
  data: AdminRole;
  allPermissions: { id: string; code: string }[];
}

export function CellAction({ data, allPermissions }: CellActionProps) {
  const t = useTranslations('admin.roles.cellAction');
  const tCommon = useTranslations('common');
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
        <TooltipContent>{t('systemRole')}</TooltipContent>
      </Tooltip>
    );
  }

  async function handleDelete() {
    if (!confirm(t('confirmDelete', { name: data.name }))) return;

    setDeleting(true);
    try {
      const res = await apiClient(`/api/admin/roles/${data.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? t('deleteFailed'));
      }
      toast.success(t('deleteSuccess', { name: data.name }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deleteFailed'));
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
          <DropdownMenuLabel>{tCommon('actions')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <IconEdit className='mr-2 h-4 w-4' /> {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deleting}
            className='text-destructive'
          >
            <IconTrash className='mr-2 h-4 w-4' />
            {deleting ? tCommon('deleting') : t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
