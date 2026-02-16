import { redirect } from 'next/navigation'
import { isClerkEnabled } from '@/server/auth/clerk-enabled'

export default async function Dashboard() {
  if (!isClerkEnabled) {
    redirect('/dashboard/overview')
  }

  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()

  if (!userId) {
    return redirect('/auth/sign-in')
  } else {
    redirect('/dashboard/overview')
  }
}
