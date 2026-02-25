'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Label, Pie, PieChart } from 'recharts';
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

interface SourceStat {
  source: string;
  count: number;
}

interface PieGraphProps {
  data: SourceStat[];
}

const SOURCE_LABELS: Record<string, string> = {
  email: 'Email',
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
  unknown: 'Other'
};

const MOCK_DATA: SourceStat[] = [
  { source: 'email', count: 120 },
  { source: 'google', count: 58 },
  { source: 'github', count: 34 }
];

const GRADIENT_IDS = ['fill0', 'fill1', 'fill2', 'fill3', 'fill4'];
const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4];

export function PieGraph({ data }: PieGraphProps) {
  const t = useTranslations('overview.pieGraph');
  const sourceData = data.length === 0 ? MOCK_DATA : data;

  const chartData = React.useMemo(
    () =>
      sourceData.map((d, i) => ({
        name: SOURCE_LABELS[d.source] ?? d.source,
        value: Number(d.count),
        fill: `url(#${GRADIENT_IDS[i] ?? GRADIENT_IDS[GRADIENT_IDS.length - 1]})`
      })),
    [sourceData]
  );

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = { value: { label: 'Users' } };
    chartData.forEach((d) => {
      cfg[d.name] = { label: d.name, color: 'var(--primary)' };
    });
    return cfg;
  }, [chartData]);

  const totalUsers = React.useMemo(
    () => chartData.reduce((s, d) => s + d.value, 0),
    [chartData]
  );

  const topSource = chartData[0];
  const topPct =
    totalUsers > 0 && topSource
      ? ((topSource.value / totalUsers) * 100).toFixed(1)
      : '0.0';

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            {t('descriptionFull')}
          </span>
          <span className='@[540px]/card:hidden'>{t('descriptionShort')}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {chartData.map((_, i) => (
                <linearGradient
                  key={i}
                  id={GRADIENT_IDS[i]}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--primary)'
                    stopOpacity={OPACITIES[i] ?? 0.3}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary)'
                    stopOpacity={(OPACITIES[i] ?? 0.3) - 0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey='value'
              nameKey='name'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalUsers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          {t('totalUsers')}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        {topSource && (
          <>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {t('leadsWith', { source: topSource.name, pct: topPct })}{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground leading-none'>
              {t('basedOn', { total: totalUsers.toLocaleString() })}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
