import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes: pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Auth pages: pass through, but redirect logged-in users to dashboard
  if (pathname.startsWith('/auth/')) {
    const token = req.cookies.get('access_token')?.value;
    if (token) {
      return NextResponse.redirect(new URL('/dashboard/overview', req.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes: require auth
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // Root path: redirect based on auth state
  if (pathname === '/') {
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard/overview', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
