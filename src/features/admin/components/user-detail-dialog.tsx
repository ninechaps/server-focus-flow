'use client';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AdminUser } from './user-tables/columns';
import { apiClient } from '@/lib/api-client';

interface UserDetailDialogProps {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    minute: '2-digit',
    second: '2-digit'
  });
}

const USER_TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  client: 'secondary',
  admin: 'default',
  both: 'outline'
};

export function UserDetailDialog({
  user,
  open,
  onOpenChange
}: UserDetailDialogProps) {
  const t = useTranslations('admin.users.detail');
  const [clientLoginEnabled, setClientLoginEnabled] = useState(
    user.clientLoginEnabled
  );
  const [toggling, setToggling] = useState(false);

  async function handleClientLoginToggle(checked: boolean) {
    setToggling(true);
    try {
      const res = await apiClient(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientLoginEnabled: checked })
      });
      if (res.ok) {
        setClientLoginEnabled(checked);
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>{t('email')}</p>
              <p className='font-medium'>{user.email}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('username')}</p>
              <p className='font-medium'>{user.username ?? '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('source')}</p>
              <Badge variant='outline' className='uppercase'>
                {user.registrationSource}
              </Badge>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('userType')}</p>
              <Badge
                variant={USER_TYPE_VARIANT[user.userType] ?? 'outline'}
                className='capitalize'
              >
                {user.userType}
              </Badge>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('onlineTime')}</p>
              <p className='font-medium'>
                {formatDuration(user.totalOnlineTime)}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('registered')}</p>
              <p className='font-medium'>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('lastLogin')}</p>
              <p className='font-medium'>{formatDate(user.lastLoginAt)}</p>
            </div>
            <div>
              <p className='text-muted-foreground mb-1'>{t('clientAccess')}</p>
              <Switch
                checked={clientLoginEnabled}
                onCheckedChange={handleClientLoginToggle}
                disabled={toggling}
                aria-label='Toggle client login'
              />
            </div>
          </div>
          <Separator />
          <div>
            <p className='text-muted-foreground mb-2 text-sm'>{t('roles')}</p>
            <div className='flex flex-wrap gap-1'>
              {user.roles.map((role) => (
                <Badge key={role} variant='secondary'>
                  {role}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <span className='text-muted-foreground text-sm'>
                  {t('noRoles')}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
