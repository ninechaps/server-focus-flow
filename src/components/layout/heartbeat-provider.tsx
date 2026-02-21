'use client';
import { useHeartbeat } from '@/hooks/use-heartbeat';

export function HeartbeatProvider({
  sessionId,
  children
}: {
  sessionId: string | null;
  children: React.ReactNode;
}) {
  useHeartbeat(sessionId);
  return <>{children}</>;
}
