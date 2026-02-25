import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { apiAccessLogs } from '@/server/db/schema';
import type { ClientSource } from './middleware';

interface LogOptions {
  userId?: string;
  clientSource?: ClientSource;
}

type LoggedHandler = (
  req: NextRequest,
  opts?: LogOptions
) => Promise<NextResponse>;

function extractClientSource(req: NextRequest): ClientSource {
  const clientType = req.headers.get('x-client-type');
  if (clientType === 'macos-app') return 'macos-app';
  return 'web-dashboard';
}

function extractIpAddress(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  );
}

async function writeLog(data: {
  userId?: string | null;
  path: string;
  method: string;
  clientSource: string;
  statusCode: number;
  durationMs: number;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await db.insert(apiAccessLogs).values({
      userId: data.userId ?? null,
      path: data.path,
      method: data.method,
      clientSource: data.clientSource,
      statusCode: data.statusCode,
      durationMs: data.durationMs,
      ipAddress: data.ipAddress ?? null
    });
  } catch {
    // 日志写入失败不影响响应
  }
}

/**
 * API 访问日志中间件
 * 包装业务路由，异步写入访问日志，不阻塞响应
 */
export function withLog(handler: LoggedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const path = req.nextUrl.pathname;
    const method = req.method;
    const clientSource = extractClientSource(req);
    const ipAddress = extractIpAddress(req);

    const res = await handler(req);

    const durationMs = Date.now() - start;
    const statusCode = res.status;

    // 异步写入，不等待
    void writeLog({
      path,
      method,
      clientSource,
      statusCode,
      durationMs,
      ipAddress
    });

    return res;
  };
}

/**
 * 带用户信息的 API 访问日志中间件（用于已认证路由）
 */
export function withAuthLog(
  handler: (req: NextRequest) => Promise<NextResponse>,
  getUserId: (req: NextRequest) => Promise<string | null>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const path = req.nextUrl.pathname;
    const method = req.method;
    const clientSource = extractClientSource(req);
    const ipAddress = extractIpAddress(req);

    const [res, userId] = await Promise.all([handler(req), getUserId(req)]);

    const durationMs = Date.now() - start;
    const statusCode = res.status;

    void writeLog({
      userId,
      path,
      method,
      clientSource,
      statusCode,
      durationMs,
      ipAddress
    });

    return res;
  };
}
