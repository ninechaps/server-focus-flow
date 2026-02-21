'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconDeviceLaptop,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconLogout
} from '@tabler/icons-react';

export interface SessionData {
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

interface SessionCardProps {
  session: SessionData;
  isCurrent: boolean;
  onLogout: (sessionId: string) => void;
  isLoggingOut: boolean;
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function SessionCard({
  session,
  isCurrent,
  onLogout,
  isLoggingOut
}: SessionCardProps) {
  const DeviceIcon = getDeviceIcon(session.deviceType);

  return (
    <Card className={isCurrent ? 'border-primary' : ''}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='flex items-center gap-3'>
          <DeviceIcon className='text-muted-foreground h-6 w-6' />
          <div>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              {session.deviceName ?? 'Unknown Device'}
              {isCurrent && (
                <Badge variant='default' className='text-xs'>
                  Current
                </Badge>
              )}
            </CardTitle>
            <CardDescription className='text-xs'>
              {session.ipAddress ?? 'Unknown IP'} &middot;{' '}
              {session.authMethod.toUpperCase()}
            </CardDescription>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              session.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className='text-muted-foreground text-xs'>
            {session.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div className='text-muted-foreground space-y-1 text-xs'>
            <p>Login: {formatDate(session.loginAt)}</p>
            <p>Last active: {formatDate(session.lastActiveAt)}</p>
          </div>
          {!isCurrent && !session.logoutAt && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onLogout(session.id)}
              disabled={isLoggingOut}
            >
              <IconLogout className='mr-1 h-4 w-4' />
              Logout
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
