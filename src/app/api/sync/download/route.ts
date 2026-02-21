import { NextRequest } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { withJwtAuth } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { syncData } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withJwtAuth(async (req, ctx) => {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('device_id');

    const conditions = [eq(syncData.userId, ctx.userId)];
    if (deviceId) {
      conditions.push(eq(syncData.deviceId, deviceId));
    }

    const record = await db
      .select()
      .from(syncData)
      .where(and(...conditions))
      .orderBy(desc(syncData.syncedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!record) {
      return successResponse(null);
    }

    return successResponse({
      encryptedData: record.encryptedData,
      dataHash: record.dataHash,
      deviceId: record.deviceId,
      syncedAt: record.syncedAt
    });
  } catch (error) {
    console.error('Sync download error:', error);
    return errorResponse('Internal server error', 500);
  }
});
