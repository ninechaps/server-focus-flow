import { NextRequest, NextResponse } from 'next/server'

const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default async function middleware(req: NextRequest) {
  // API routes bypass Clerk entirely — protected by custom JWT middleware
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // If Clerk is not configured, skip Clerk middleware
  if (!hasClerkKeys) {
    return NextResponse.next()
  }

  // Dynamically import Clerk to avoid module-level publishableKey check
  const { clerkMiddleware, createRouteMatcher } = await import(
    '@clerk/nextjs/server'
  )
  const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

  return clerkMiddleware(async (auth) => {
    if (isProtectedRoute(req)) await auth.protect()
  })(req, {} as any)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
