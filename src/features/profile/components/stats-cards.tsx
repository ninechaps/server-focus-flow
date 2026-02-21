'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconClock, IconLogin } from '@tabler/icons-react';

interface StatsCardsProps {
  totalOnlineTime: number;
  lastLoginAt: string | null;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function StatsCards({ totalOnlineTime, lastLoginAt }: StatsCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Total Online Time
          </CardTitle>
          <IconClock className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatDuration(totalOnlineTime)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Last Login</CardTitle>
          <IconLogin className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{formatDate(lastLoginAt)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
