import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconUserPlus,
  IconActivity,
  IconWifi
} from '@tabler/icons-react';
import React from 'react';
import { db } from '@/server/db';
import { users, userSessions } from '@/server/db/schema';
import { count, gte, and, lt, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

function getMonthBoundary(monthsAgo: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats,
  client_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
  client_stats: React.ReactNode;
}) {
  const t = await getTranslations('overview.kpi');
  const thisMonthStart = getMonthBoundary(0);
  const lastMonthStart = getMonthBoundary(1);
  const todayStart = getTodayStart();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [totalRes, thisMonthRes, lastMonthRes, todayRes, onlineRes] =
    await Promise.all([
      db.select({ n: count() }).from(users),
      db
        .select({ n: count() })
        .from(users)
        .where(gte(users.createdAt, thisMonthStart)),
      db
        .select({ n: count() })
        .from(users)
        .where(
          and(
            gte(users.createdAt, lastMonthStart),
            lt(users.createdAt, thisMonthStart)
          )
        ),
      db
        .select({
          n: sql<number>`count(distinct ${userSessions.userId})`
        })
        .from(userSessions)
        .where(gte(userSessions.loginAt, todayStart)),
      db
        .select({ n: count() })
        .from(userSessions)
        .where(gte(userSessions.lastActiveAt, fiveMinAgo))
    ]);

  const totalUsers = totalRes[0]?.n ?? 0;
  const thisMonthNew = thisMonthRes[0]?.n ?? 0;
  const lastMonthNew = lastMonthRes[0]?.n ?? 0;
  const todayActive = Number(todayRes[0]?.n ?? 0);
  const onlineNow = onlineRes[0]?.n ?? 0;

  const monthDiff = thisMonthNew - lastMonthNew;
  const monthGrowthPct =
    lastMonthNew > 0
      ? Math.abs((monthDiff / lastMonthNew) * 100).toFixed(1)
      : thisMonthNew > 0
        ? '100.0'
        : '0.0';
  const monthTrendingUp = monthDiff >= 0;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {t('welcomeBack')}
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {/* 总用户数 */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>
                <IconUsers className='mr-1 inline h-4 w-4' />
                {t('totalUsers')}
              </CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {totalUsers.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUsers className='h-3 w-3' />
                  {t('allTime')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('registeredUsers')}
              </div>
              <div className='text-muted-foreground'>
                {t('includesAllSources')}
              </div>
            </CardFooter>
          </Card>

          {/* 本月新增 */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>
                <IconUserPlus className='mr-1 inline h-4 w-4' />
                {t('newThisMonth')}
              </CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {thisMonthNew.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {monthTrendingUp ? <IconTrendingUp /> : <IconTrendingDown />}
                  {monthTrendingUp ? '+' : '-'}
                  {monthGrowthPct}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {monthTrendingUp ? (
                  <>
                    {t('upFromLastMonth')} <IconTrendingUp className='size-4' />
                  </>
                ) : (
                  <>
                    {t('downFromLastMonth')}{' '}
                    <IconTrendingDown className='size-4' />
                  </>
                )}
              </div>
              <div className='text-muted-foreground'>
                {t('lastMonth', { n: lastMonthNew.toLocaleString() })}
              </div>
            </CardFooter>
          </Card>

          {/* 今日活跃 */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>
                <IconActivity className='mr-1 inline h-4 w-4' />
                {t('activeToday')}
              </CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {todayActive.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconActivity />
                  {t('today')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('uniqueUsersLoggedIn')}
              </div>
              <div className='text-muted-foreground'>{t('sinceMidnight')}</div>
            </CardFooter>
          </Card>

          {/* 当前在线 */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>
                <IconWifi className='mr-1 inline h-4 w-4' />
                {t('onlineNow')}
              </CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {onlineNow.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconWifi />
                  {t('live')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('activeSessions')}
              </div>
              <div className='text-muted-foreground'>{t('heartbeatDesc')}</div>
            </CardFooter>
          </Card>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
          <div className='col-span-4 md:col-span-7'>{client_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
