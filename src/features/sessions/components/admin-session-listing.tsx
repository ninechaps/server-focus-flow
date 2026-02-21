import { db } from '@/server/db';
import { users, userSessions } from '@/server/db/schema';
import { asc, desc } from 'drizzle-orm';
import {
  UserSessionTable,
  type UserSessionSummary
} from './user-session-table';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export default async function AdminSessionListing() {
  const [allUsers, allSessions] = await Promise.all([
    db.select().from(users).orderBy(asc(users.email)),
    db
      .select({
        userId: userSessions.userId,
        loginAt: userSessions.loginAt,
        ipAddress: userSessions.ipAddress,
        lastActiveAt: userSessions.lastActiveAt,
        logoutAt: userSessions.logoutAt
      })
      .from(userSessions)
      .orderBy(desc(userSessions.loginAt))
  ]);

  // Group sessions by userId
  const sessionsByUser = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    const existing = sessionsByUser.get(s.userId) ?? [];
    sessionsByUser.set(s.userId, [...existing, s]);
  }

  const now = Date.now();

  const data: UserSessionSummary[] = allUsers.map((user) => {
    const sessions = sessionsByUser.get(user.id) ?? [];
    // Already ordered desc by loginAt from DB, first item is most recent
    const latestSession = sessions[0] ?? null;

    const isOnline = sessions.some(
      (s) =>
        !s.logoutAt &&
        s.lastActiveAt &&
        now - new Date(s.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS
    );

    return {
      userId: user.id,
      email: user.email,
      username: user.username ?? null,
      lastLoginAt: latestSession?.loginAt ?? null,
      lastLoginIp: latestSession?.ipAddress ?? null,
      isOnline,
      sessionCount: sessions.length
    };
  });

  return <UserSessionTable data={data} />;
}
