'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { IconExternalLink } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { AvatarUpload } from './avatar-upload';
import { ProfileInfoForm } from './profile-info-form';
import { ChangePasswordForm } from './change-password-form';
import { StatsCards } from './stats-cards';

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
  const t = useTranslations('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, statsRes] = await Promise.all([
        apiClient('/api/auth/me'),
        apiClient('/api/users/stats')
      ]);

      if (meRes.ok) {
        const json = await meRes.json();
        setUser(json.data.user);
      }
      if (statsRes.ok) {
        const json = await statsRes.json();
        setStats(json.data);
      }
    } catch {
      toast.error(t('loadError'));
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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='bg-muted h-36 animate-pulse rounded-lg' />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <p className='text-muted-foreground py-8 text-center'>
        {t('loginAgain')}
      </p>
    );
  }

  return (
    <div className='space-y-6'>
      {/* ① 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('basicInfo.title')}</CardTitle>
          <CardDescription>{t('basicInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center gap-4'>
            <AvatarUpload
              avatarUrl={user.avatarUrl}
              initials={getInitials(user.fullName, user.email)}
              onUpdated={(url) =>
                setUser((u) => (u ? { ...u, avatarUrl: url } : u))
              }
            />
            <div>
              <p className='text-base font-semibold'>
                {user.fullName ?? user.username ?? user.email}
              </p>
              <p className='text-muted-foreground text-sm'>{user.email}</p>
            </div>
          </div>
          <Separator />
          <ProfileInfoForm
            userId={user.id}
            initialFullName={user.fullName}
            initialUsername={user.username}
            onUpdated={({ fullName, username }) =>
              setUser((u) => (u ? { ...u, fullName, username } : u))
            }
          />
        </CardContent>
      </Card>

      {/* ② 账户信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('account.title')}</CardTitle>
          <CardDescription>{t('account.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
            <div>
              <p className='text-muted-foreground'>{t('account.email')}</p>
              <p className='font-medium'>{user.email}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('account.registered')}</p>
              <p className='font-medium'>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('account.source')}</p>
              <Badge variant='outline' className='uppercase'>
                {user.registrationSource}
              </Badge>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('account.roles')}</p>
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
        </CardContent>
      </Card>

      {/* ③ 安全设置 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('security.title')}</CardTitle>
          <CardDescription>{t('security.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* ④ 使用统计 */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>{t('usageStats.title')}</h3>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/dashboard/sessions'>
              {t('usageStats.viewSessions')}{' '}
              <IconExternalLink className='ml-1 h-3 w-3' />
            </Link>
          </Button>
        </div>
        <StatsCards
          totalOnlineTime={stats?.totalOnlineTime ?? 0}
          lastLoginAt={stats?.lastLoginAt ?? null}
        />
      </div>
    </div>
  );
}
