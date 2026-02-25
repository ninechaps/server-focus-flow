'use client';
import { useCallback, useEffect, useState } from 'react';
import { SessionCard, type SessionData } from './session-card';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

export function SessionList() {
  const t = useTranslations('sessions');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOutId, setLoggingOutId] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('deviceId');
    if (stored) setCurrentDeviceId(stored);
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient('/api/sessions');

      if (!res.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const json = await res.json();
      setSessions(json.data.sessions);
    } catch (error) {
      toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleLogout(sessionId: string) {
    setLoggingOutId(sessionId);
    try {
      const res = await apiClient(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to logout session');
      }

      toast.success(t('logoutSuccess'));
      fetchSessions();
    } catch (error) {
      toast.error(t('logoutFailed'));
    } finally {
      setLoggingOutId(null);
    }
  }

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='bg-muted h-36 animate-pulse rounded-lg' />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className='text-muted-foreground py-8 text-center'>
        {t('noSessions')}
      </p>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isCurrent={session.deviceId === currentDeviceId}
          onLogout={handleLogout}
          isLoggingOut={loggingOutId === session.id}
        />
      ))}
    </div>
  );
}
