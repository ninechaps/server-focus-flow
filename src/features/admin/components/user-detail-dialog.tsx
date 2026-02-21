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
import type { AdminUser } from './user-tables/columns';

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

export function UserDetailDialog({
  user,
  open,
  onOpenChange
}: UserDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Email</p>
              <p className='font-medium'>{user.email}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Username</p>
              <p className='font-medium'>{user.username ?? '-'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Source</p>
              <Badge variant='outline' className='uppercase'>
                {user.registrationSource}
              </Badge>
            </div>
            <div>
              <p className='text-muted-foreground'>Online Time</p>
              <p className='font-medium'>
                {formatDuration(user.totalOnlineTime)}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground'>Registered</p>
              <p className='font-medium'>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Last Login</p>
              <p className='font-medium'>{formatDate(user.lastLoginAt)}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className='text-muted-foreground mb-2 text-sm'>Roles</p>
            <div className='flex flex-wrap gap-1'>
              {user.roles.map((role) => (
                <Badge key={role} variant='secondary'>
                  {role}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <span className='text-muted-foreground text-sm'>
                  No roles assigned
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
