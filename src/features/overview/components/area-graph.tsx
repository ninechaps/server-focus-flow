'use client';

import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import * as React from 'react';
import { useTranslations } from 'next-intl';

interface MonthStat {
  month: string;
  label: string;
  count: number;
}

interface AreaGraphProps {
  data: MonthStat[];
}

const chartConfig = {
  newUsers: {
    label: 'New Users',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

// 6 个月 mock 数据
const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const MOCK_COUNTS = [42, 67, 53, 88, 74, 91];
const MOCK_DATA = MOCK_MONTHS.map((label, i) => ({
  label,
  newUsers: MOCK_COUNTS[i]
}));

export function AreaGraph({ data }: AreaGraphProps) {
  const t = useTranslations('overview.areaGraph');
  const chartData = React.useMemo(() => {
    if (data.length === 0) return MOCK_DATA;
    return data.map((d) => ({ label: d.label, newUsers: d.count }));
  }, [data]);

  const lastTwo = chartData.slice(-2);
  const prev = lastTwo[0]?.newUsers ?? 0;
  const curr = lastTwo[1]?.newUsers ?? 0;
  const growthPct =
    prev > 0
      ? (((curr - prev) / prev) * 100).toFixed(1)
      : curr > 0
        ? '100.0'
        : '0.0';
  const trendingUp = curr >= prev;

  const firstLabel = chartData[0]?.label ?? '';
  const lastLabel = chartData[chartData.length - 1]?.label ?? '';

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id='fillNewUsers' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-newUsers)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-newUsers)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='newUsers'
              type='natural'
              fill='url(#fillNewUsers)'
              stroke='var(--color-newUsers)'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {trendingUp ? (
                <>
                  {t('trendingUp', { pct: growthPct })}{' '}
                  <IconTrendingUp className='h-4 w-4' />
                </>
              ) : (
                <>
                  {t('down', { pct: growthPct })}{' '}
                  <IconTrendingDown className='h-4 w-4' />
                </>
              )}
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {firstLabel} – {lastLabel}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
