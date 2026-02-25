import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { withJwtAuth } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { clientSettings, type ClientSettingsData } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

/**
 * GET /api/client/settings
 * 获取当前用户的客户端设置，不存在时返回空对象（客户端使用默认值）
 */
export const GET = withJwtAuth(async (_req: NextRequest, ctx) => {
  try {
    const row = await db.query.clientSettings.findFirst({
      where: eq(clientSettings.userId, ctx.userId)
    });

    return successResponse({
      settings: (row?.settings ?? {}) as ClientSettingsData,
      version: row?.version ?? 0,
      updatedAt: row?.updatedAt ?? null,
      syncedAt: row?.syncedAt ?? null
    });
  } catch (error) {
    console.error('Get client settings error:', error);
    return errorResponse('Internal server error', 500);
  }
});

/**
 * PATCH /api/client/settings
 * 更新客户端设置（深度合并，非整体替换）
 * Body: { settings: Partial<ClientSettingsData>, version: number }
 * version 必须与当前服务端版本一致，否则返回 409（需客户端先拉取最新再重试）
 */
export const PATCH = withJwtAuth(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();

    if (!body.settings || typeof body.settings !== 'object') {
      return errorResponse('settings is required and must be an object', 400);
    }

    const existing = await db.query.clientSettings.findFirst({
      where: eq(clientSettings.userId, ctx.userId)
    });

    // 乐观锁校验：客户端传来的 version 必须与服务端当前版本一致
    const clientVersion: number = body.version ?? 0;
    const serverVersion: number = existing?.version ?? 0;
    if (existing && clientVersion !== serverVersion) {
      return errorResponse(
        `Version conflict: server=${serverVersion}, client=${clientVersion}. Fetch latest and retry.`,
        409
      );
    }

    // 深度合并：客户端只需传变更的部分，其余保留
    const merged = deepMerge(
      (existing?.settings ?? {}) as ClientSettingsData,
      body.settings as Partial<ClientSettingsData>
    );

    if (existing) {
      const [updated] = await db
        .update(clientSettings)
        .set({
          settings: merged,
          version: serverVersion + 1,
          updatedAt: new Date(),
          syncedAt: new Date()
        })
        .where(eq(clientSettings.userId, ctx.userId))
        .returning();

      return successResponse({
        settings: updated.settings as ClientSettingsData,
        version: updated.version,
        updatedAt: updated.updatedAt
      });
    }

    const [created] = await db
      .insert(clientSettings)
      .values({
        userId: ctx.userId,
        settings: merged,
        version: 1,
        syncedAt: new Date()
      })
      .returning();

    return successResponse({
      settings: created.settings as ClientSettingsData,
      version: created.version,
      updatedAt: created.updatedAt
    });
  } catch (error) {
    console.error('Update client settings error:', error);
    return errorResponse('Internal server error', 500);
  }
});

function deepMerge<T extends object>(base: T, patch: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const patchVal = patch[key];
    const baseVal = result[key];
    if (
      patchVal !== null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as object,
        patchVal as object
      ) as T[keyof T];
    } else {
      result[key] = patchVal as T[keyof T];
    }
  }
  return result;
}
