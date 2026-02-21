import { NextRequest } from 'next/server';
import { withJwtAuth } from '@/server/auth/middleware';
import { syncUploadSchema } from '@/server/auth/validation/schemas';
import { db } from '@/server/db';
import { syncData } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

export const POST = withJwtAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = syncUploadSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { encryptedData, dataHash, deviceId } = parsed.data;

    const [record] = await db
      .insert(syncData)
      .values({
        userId: ctx.userId,
        encryptedData,
        dataHash,
        deviceId
      })
      .returning();

    return successResponse({
      id: record.id,
      syncedAt: record.syncedAt
    });
  } catch (error) {
    console.error('Sync upload error:', error);
    return errorResponse('Internal server error', 500);
  }
});
