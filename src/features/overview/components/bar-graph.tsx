'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
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

interface BarGraphProps {
  data: DailyStat[];
}

const chartConfig = {
  'macos-app': {
    label: 'macOS App',
    color: 'var(--primary)'
  },
  'web-dashboard': {
    label: 'Web Dashboard',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

// 30 天 mock 数据（无真实数据时降级）
const MOCK_DATA: {
  date: string;
  'macos-app': number;
  'web-dashboard': number;
}[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
  return {
    date: d.toISOString().slice(0, 10),
    'macos-app': [
      8, 12, 5, 18, 22, 15, 9, 25, 30, 14, 7, 20, 17, 11, 26, 19, 6, 23, 28, 13,
      10, 21, 16, 24, 29, 8, 18, 12, 27, 15
    ][i],
    'web-dashboard': [
      18, 25, 12, 32, 40, 28, 15, 45, 55, 22, 14, 38, 30, 20, 48, 35, 11, 42,
      52, 24, 17, 39, 29, 44, 50, 16, 33, 21, 46, 27
    ][i]
  };
});

function buildChartData(data: DailyStat[]) {
  const map = new Map<
    string,
    { date: string; 'macos-app': number; 'web-dashboard': number }
  >();
  for (const row of data) {
    const entry = map.get(row.date) ?? {
      date: row.date,
      'macos-app': 0,
      'web-dashboard': 0
    };
    if (
      row.clientSource === 'macos-app' ||
      row.clientSource === 'web-dashboard'
    ) {
      entry[row.clientSource] += Number(row.count);
    }
    map.set(row.date, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

type ActiveKey = 'macos-app' | 'web-dashboard';

export function BarGraph({ data }: BarGraphProps) {
  const t = useTranslations('overview.barGraph');
  const [activeChart, setActiveChart] = React.useState<ActiveKey>('macos-app');

  const chartData = React.useMemo(
    () => (data.length === 0 ? MOCK_DATA : buildChartData(data)),
    [data]
  );

  const totals = React.useMemo(
    () => ({
      'macos-app': chartData.reduce((s, d) => s + d['macos-app'], 0),
      'web-dashboard': chartData.reduce((s, d) => s + d['web-dashboard'], 0)
    }),
    [chartData]
  );

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              {t('descriptionFull')}
            </span>
            <span className='@[540px]/card:hidden'>
              {t('descriptionShort')}
            </span>
          </CardDescription>
        </div>
        <div className='flex'>
          {(['macos-app', 'web-dashboard'] as ActiveKey[]).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
              onClick={() => setActiveChart(key)}
            >
              <span className='text-muted-foreground text-xs'>
                {chartConfig[key].label}
              </span>
              <span className='text-lg leading-none font-bold sm:text-3xl'>
                {totals[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              }
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[160px]'
                  nameKey={activeChart}
                  labelFormatter={(value: string) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  }
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillBar)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
