'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

interface UserAssignRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

export function UserAssignRolesDialog({
  open,
  onOpenChange,
  userId,
  userEmail
}: UserAssignRolesDialogProps) {
  const t = useTranslations('admin.users.assignRoles');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    apiClient(`/api/admin/users/${userId}/roles`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        setAllRoles(json.data.allRoles);
        setSelectedRoleIds(json.data.userRoleIds);
      })
      .catch(() => toast.error(t('loadFailed')))
      .finally(() => setLoading(false));
  }, [open, userId]);

  function toggleRole(roleId: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const res = await apiClient(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: selectedRoleIds })
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to update roles');
      }
      toast.success(t('updateSuccess'));
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tCommon('somethingWentWrong')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription className='truncate'>
            {userEmail}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='space-y-2 py-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='bg-muted h-8 animate-pulse rounded' />
            ))}
          </div>
        ) : (
          <ScrollArea className='max-h-60'>
            <div className='space-y-2 py-2'>
              {allRoles.length === 0 && (
                <p className='text-muted-foreground text-sm'>{t('noRoles')}</p>
              )}
              {allRoles.map((role) => (
                <div key={role.id} className='flex items-center gap-3'>
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className='flex-1 cursor-pointer text-sm'
                  >
                    <span className='font-medium'>{role.name}</span>
                    {role.description && (
                      <span className='text-muted-foreground ml-2 text-xs'>
                        {role.description}
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={submitting || loading}>
            {submitting ? tCommon('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
