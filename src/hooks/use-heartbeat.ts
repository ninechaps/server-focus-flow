'use client';
import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

const INTERVAL_MS = 2 * 60 * 1000; // 2 分钟，低于服务端 5 分钟在线阈值

export function useHeartbeat(sessionId: string | null) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    async function beat() {
      if (document.visibilityState === 'hidden') return;
      try {
        await apiClient('/api/sessions/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch {
        // 网络错误静默忽略，不影响使用
      }
    }

    beat(); // 挂载后立即打一次
    timerRef.current = setInterval(beat, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);
}
