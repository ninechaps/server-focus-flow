'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface DailyStat {
  date: string;
  clientSource: string;
  count: number;
}

interface ClientSourceChartProps {
  dailyStats: DailyStat[];
  activeClients: {
    macos: number;
    web: number;
  };
}

const chartConfig: ChartConfig = {
  'macos-app': {
    label: 'macOS App',
    color: 'hsl(var(--chart-1))'
  },
  'web-dashboard': {
    label: 'Web Dashboard',
    color: 'hsl(var(--chart-2))'
  }
};

function buildChartData(dailyStats: DailyStat[]) {
  const dateMap = new Map<
    string,
    { date: string; 'macos-app': number; 'web-dashboard': number }
  >();

  for (const stat of dailyStats) {
    const existing = dateMap.get(stat.date) ?? {
      date: stat.date,
      'macos-app': 0,
      'web-dashboard': 0
    };
    if (
      stat.clientSource === 'macos-app' ||
      stat.clientSource === 'web-dashboard'
    ) {
      existing[stat.clientSource] += Number(stat.count);
    }
    dateMap.set(stat.date, existing);
  }

  return Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function ClientSourceChart({
  dailyStats,
  activeClients
}: ClientSourceChartProps) {
  const t = useTranslations('overview.clientChart');
  const chartData = React.useMemo(
    () => buildChartData(dailyStats),
    [dailyStats]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
          <span className='ml-4 text-xs font-normal'>
            {t('activeNow', {
              macos: activeClients.macos,
              web: activeClients.web
            })}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-[200px] w-full'>
          <BarChart
            data={chartData}
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const d = new Date(value);
                return d.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} width={30} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label: string) => {
                    return new Date(label).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey='macos-app'
              fill='var(--color-macos-app)'
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey='web-dashboard'
              fill='var(--color-web-dashboard)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
