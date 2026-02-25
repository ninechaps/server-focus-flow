'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';

interface RoleEntry {
  id: string;
  name: string;
  description: string | null;
}

interface PermissionRolesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionId: string;
  permissionCode: string;
}

export function PermissionRolesSheet({
  open,
  onOpenChange,
  permissionId,
  permissionCode
}: PermissionRolesSheetProps) {
  const t = useTranslations('admin.permissions.rolesSheet');
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !permissionId) return;

    setLoading(true);
    apiClient(`/api/admin/permissions/${permissionId}/roles`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setRoles(json.data.roles))
      .catch(() => toast.error(t('noRoles')))
      .finally(() => setLoading(false));
  }, [open, permissionId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md'>
        <SheetHeader className='px-6 pt-6 pb-4'>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription className='font-mono text-xs'>
            {permissionCode}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {loading ? (
            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className='bg-muted h-14 animate-pulse rounded-lg'
                />
              ))}
            </div>
          ) : roles.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              {t('noRoles')}
            </p>
          ) : (
            <div className='space-y-2'>
              {roles.map((role) => (
                <div key={role.id} className='rounded-lg border p-3'>
                  <p className='text-sm font-medium'>{role.name}</p>
                  {role.description && (
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {role.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
