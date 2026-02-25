'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';

interface ApiLog {
  id: string;
  path: string;
  method: string;
  clientSource: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string | null;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
}

interface LogsResponse {
  success: boolean;
  data: {
    logs: ApiLog[];
    total: number;
    page: number;
    perPage: number;
  };
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'macos-app') {
    return <Badge variant='default'>macOS</Badge>;
  }
  if (source === 'web-dashboard') {
    return <Badge variant='secondary'>Web</Badge>;
  }
  return <Badge variant='outline'>{source}</Badge>;
}

function StatusBadge({ code }: { code: number }) {
  if (code >= 200 && code < 300) {
    return (
      <Badge variant='secondary' className='bg-green-100 text-green-800'>
        {code}
      </Badge>
    );
  }
  if (code >= 400 && code < 500) {
    return (
      <Badge variant='outline' className='border-yellow-400 text-yellow-700'>
        {code}
      </Badge>
    );
  }
  if (code >= 500) {
    return <Badge variant='destructive'>{code}</Badge>;
  }
  return <Badge variant='outline'>{code}</Badge>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function ApiLogsListing() {
  const t = useTranslations('admin.apiLogs');
  const tCommon = useTranslations('common');

  const CLIENT_SOURCE_OPTIONS = useMemo(
    () => [
      { value: 'all', label: t('allSources') },
      { value: 'macos-app', label: 'macOS App' },
      { value: 'web-dashboard', label: 'Web Dashboard' },
      { value: 'unknown', label: tCommon('noData') }
    ],
    [t, tCommon]
  );

  const STATUS_CODE_OPTIONS = useMemo(
    () => [
      { value: 'all', label: t('allStatus') },
      { value: '200', label: '200 OK' },
      { value: '201', label: '201 Created' },
      { value: '400', label: '400 Bad Request' },
      { value: '401', label: '401 Unauthorized' },
      { value: '403', label: '403 Forbidden' },
      { value: '404', label: '404 Not Found' },
      { value: '500', label: '500 Server Error' }
    ],
    [t]
  );

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [clientSource, setClientSource] = useState('all');
  const [statusCode, setStatusCode] = useState('all');
  const [userId, setUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const perPage = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage)
      });
      if (clientSource !== 'all') params.set('clientSource', clientSource);
      if (statusCode !== 'all') params.set('statusCode', statusCode);
      if (userId.trim()) params.set('userId', userId.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await apiClient(`/api/admin/api-logs?${params.toString()}`);
      const json: LogsResponse = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setTotal(json.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, clientSource, statusCode, userId, dateFrom, dateTo]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-3'>
        <Select
          value={clientSource}
          onValueChange={(v) => {
            setClientSource(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='Source' />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_SOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusCode}
          onValueChange={(v) => {
            setStatusCode(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder={t('allStatus')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_CODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder={t('filterByUser')}
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          className='w-[200px]'
        />

        <Input
          type='date'
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className='w-[160px]'
        />
        <Input
          type='date'
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className='w-[160px]'
        />
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.time')}</TableHead>
              <TableHead>{t('columns.method')}</TableHead>
              <TableHead>{t('columns.path')}</TableHead>
              <TableHead>{t('columns.source')}</TableHead>
              <TableHead>{t('columns.user')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.duration')}</TableHead>
              <TableHead>{t('columns.ip')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='text-muted-foreground text-center'
                >
                  {t('loading')}
                </TableCell>
              </TableRow>
            )}
            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='text-muted-foreground text-center'
                >
                  {t('noLogs')}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className='text-sm whitespace-nowrap'>
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className='font-mono text-xs'>
                      {log.method}
                    </Badge>
                  </TableCell>
                  <TableCell className='max-w-[200px] truncate font-mono text-xs'>
                    {log.path}
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={log.clientSource} />
                  </TableCell>
                  <TableCell className='max-w-[150px] truncate text-sm'>
                    {log.userEmail ?? (
                      <span className='text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge code={log.statusCode} />
                  </TableCell>
                  <TableCell className='text-sm'>{log.durationMs}ms</TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {log.ipAddress ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between text-sm'>
        <span className='text-muted-foreground'>{t('total', { total })}</span>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            {tCommon('previous')}
          </Button>
          <span>
            {tCommon('page')} {page} {tCommon('of')} {totalPages || 1}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            {tCommon('next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
