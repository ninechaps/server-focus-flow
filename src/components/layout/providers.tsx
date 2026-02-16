'use client'
import { useTheme } from 'next-themes'
import React from 'react'
import { ActiveThemeProvider } from '../themes/active-theme'

const isClerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
)

function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [clerkReady, setClerkReady] = React.useState(false)
  const clerkRef = React.useRef<{
    ClerkProvider: React.ComponentType<any>
    dark: any
  } | null>(null)

  React.useEffect(() => {
    if (!isClerkEnabled) return
    Promise.all([import('@clerk/nextjs'), import('@clerk/themes')]).then(
      ([clerkMod, themesMod]) => {
        clerkRef.current = {
          ClerkProvider: clerkMod.ClerkProvider,
          dark: themesMod.dark,
        }
        setClerkReady(true)
      }
    )
  }, [])

  if (!isClerkEnabled || !clerkReady || !clerkRef.current) {
    return <>{children}</>
  }

  const { ClerkProvider, dark } = clerkRef.current
  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string
  children: React.ReactNode
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <ClerkWrapper>{children}</ClerkWrapper>
    </ActiveThemeProvider>
  )
}
