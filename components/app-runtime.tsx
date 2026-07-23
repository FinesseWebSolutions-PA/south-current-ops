'use client'

import { usePathname } from 'next/navigation'
import type { AppData } from '@/lib/types'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/app-shell'

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

  return (
    <StoreProvider initialData={initialData} cloudMode={cloudMode}>
      {isAuthPage ? children : <AppShell>{children}</AppShell>}
    </StoreProvider>
  )
}
