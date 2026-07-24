'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import type { AppData } from '@/lib/types'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const authPaths = ['/login', '/reset-password']

export function AppRuntime({
  children,
  initialData,
  cloudMode,
}: {
  children: React.ReactNode
  initialData?: AppData | null
  cloudMode: boolean
}) {
  const pathname = usePathname()
  const isAuthPage =
    authPaths.includes(pathname) || pathname.startsWith('/auth/')

  if (isAuthPage) return children

  if (!cloudMode) {
    return (
      <main className="grid min-h-dvh place-items-center bg-sidebar p-4">
        <Card className="w-full max-w-lg border-sidebar-border">
          <CardHeader className="items-center text-center">
            <Image
              src="/brand/south-current-mark.png"
              alt="South Current Electric"
              width={72}
              height={72}
              className="size-18 object-contain"
              priority
            />
            <CardTitle className="mt-2 text-xl">Database connection required</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              South Current Ops will not display fictional fallback records.
              Connect the production Supabase environment variables in Vercel
              to use the CRM.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!initialData) {
    return (
      <main className="grid min-h-dvh place-items-center bg-sidebar p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" render={<Link href="/login" />}>
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <StoreProvider initialData={initialData}>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  )
}
