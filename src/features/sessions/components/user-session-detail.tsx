'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  IconDeviceLaptop,
  IconDeviceDesktop,
  IconDeviceMobile
} from '@tabler/icons-react';

export interface SessionDetail {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  loginAt: string;
  lastActiveAt: string | null;
  logoutAt: string | null;
  duration: number | null;
  authMethod: string;
  isOnline: boolean;
}

type StatusFilter = 'online' | 'offline' | null;

interface UserSessionDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
      return IconDeviceMobile;
    case 'desktop':
      return IconDeviceDesktop;
    default:
      return IconDeviceLaptop;
  }
}

function formatDate(dateStr: string | null | Date): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function UserSessionDetail({
  open,
  onOpenChange,
  userId,
  userEmail
}: UserSessionDetailProps) {
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('online');

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    setFilter('online');

    fetch(`/api/admin/sessions/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => setSessions(json.data.sessions))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const filtered = sessions.filter((s) => {
    if (filter === 'online') return s.isOnline;
    if (filter === 'offline') return !s.isOnline;
    return true;
  });

  function toggleFilter(f: 'online' | 'offline') {
    setFilter((prev) => (prev === f ? null : f));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'>
        {/* Header */}
        <SheetHeader className='px-6 pt-6 pb-4'>
          <SheetTitle>Sessions</SheetTitle>
          <SheetDescription className='truncate'>{userEmail}</SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Filter bar */}
        <div className='flex items-center gap-2 px-6 py-4'>
          {(['online', 'offline'] as const).map((f) => (
            <Button
              key={f}
              size='sm'
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => toggleFilter(f)}
              className='capitalize'
            >
              {f}
            </Button>
          ))}
          <span className='text-muted-foreground ml-auto text-sm'>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <Separator />

        {/* Session list */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className='bg-muted h-20 animate-pulse rounded-lg'
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              No sessions found.
            </p>
          ) : (
            <div className='space-y-3'>
              {filtered.map((session) => {
                const DeviceIcon = getDeviceIcon(session.deviceType);
                return (
                  <div key={session.id} className='rounded-lg border p-4'>
                    <div className='flex items-center gap-3'>
                      <DeviceIcon className='text-muted-foreground h-5 w-5 shrink-0' />
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium'>
                            {session.deviceName ?? 'Unknown Device'}
                          </span>
                          <Badge
                            variant={session.isOnline ? 'default' : 'secondary'}
                            className='text-xs'
                          >
                            {session.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                        <div className='text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-xs'>
                          <span>{session.ipAddress ?? 'Unknown IP'}</span>
                          <span className='uppercase'>
                            {session.authMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-xs'>
                      <div>
                        <p className='text-foreground font-medium'>Login</p>
                        <p>{formatDate(session.loginAt)}</p>
                      </div>
                      <div>
                        <p className='text-foreground font-medium'>
                          Last Active
                        </p>
                        <p>{formatDate(session.lastActiveAt)}</p>
                      </div>
                      <div>
                        <p className='text-foreground font-medium'>Duration</p>
                        <p>{formatDuration(session.duration)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
