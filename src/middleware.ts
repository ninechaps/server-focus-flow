import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes: pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // macOS 客户端注册页：始终放行，不做任何认证重定向。
  // 即使浏览器携带了管理员的 access_token cookie，也不影响此页面的访问。
  if (pathname === '/auth/register/client') {
    return NextResponse.next();
  }

  // 其他 auth 页面：已登录用户直接跳转至 dashboard
  if (pathname.startsWith('/auth/')) {
    const token = req.cookies.get('access_token')?.value;
    if (token) {
      return NextResponse.redirect(new URL('/dashboard/overview', req.url));
    }
    return NextResponse.next();
  }

  // Dashboard 路由：未登录则跳转至登录页
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
