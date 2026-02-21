'use client';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatsCards } from './stats-cards';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  registrationSource: string;
  createdAt: string | null;
  roles: string[];
  permissions: string[];
}

interface UserStats {
  totalOnlineTime: number;
  lastLoginAt: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/users/stats')
      ]);

      if (meRes.ok) {
        const meJson = await meRes.json();
        setUser(meJson.data.user);
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.data);
      }
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='bg-muted h-48 animate-pulse rounded-lg' />
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='bg-muted h-28 animate-pulse rounded-lg' />
          <div className='bg-muted h-28 animate-pulse rounded-lg' />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <p className='text-muted-foreground py-8 text-center'>
        Unable to load profile. Please login again.
      </p>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className='text-lg'>
                {getInitials(user.fullName, user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {user.fullName ?? user.username ?? user.email}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
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
              <p className='text-muted-foreground'>Registered</p>
              <p className='font-medium'>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Roles</p>
              <div className='flex flex-wrap gap-1'>
                {user.roles.map((role) => (
                  <Badge key={role} variant='secondary' className='text-xs'>
                    {role}
                  </Badge>
                ))}
                {user.roles.length === 0 && (
                  <span className='text-muted-foreground'>-</span>
                )}
              </div>
            </div>
          </div>

          {user.permissions.length > 0 && (
            <>
              <Separator className='my-4' />
              <div>
                <p className='text-muted-foreground mb-2 text-sm'>
                  Permissions
                </p>
                <div className='flex flex-wrap gap-1'>
                  {user.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant='outline'
                      className='font-mono text-xs'
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <StatsCards
        totalOnlineTime={stats?.totalOnlineTime ?? 0}
        lastLoginAt={stats?.lastLoginAt ?? null}
      />
    </div>
  );
}
