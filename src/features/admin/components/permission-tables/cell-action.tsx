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
import { useTranslations } from 'next-intl';
import { PermissionFormDialog } from '../permission-form-dialog';
import type { AdminPermission } from './columns';
import { apiClient } from '@/lib/api-client';

interface CellActionProps {
  data: AdminPermission;
}

export function CellAction({ data }: CellActionProps) {
  const t = useTranslations('admin.permissions.cellAction');
  const tCommon = useTranslations('common');
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(t('confirmDelete', { code: data.code }))) return;

    setDeleting(true);
    try {
      const res = await apiClient(`/api/admin/permissions/${data.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? t('deleteFailed'));
      }
      toast.success(t('deleteSuccess', { code: data.code }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deleteFailed'));
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
