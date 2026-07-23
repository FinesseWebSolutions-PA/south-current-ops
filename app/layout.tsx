import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppRuntime } from '@/components/app-runtime'
import { Toaster } from '@/components/ui/sonner'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { loadCloudData } from '@/lib/supabase/data'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'South Current Ops — CRM & Time Tracking',
  description:
    'Client management, job tracking, employee time tracking, scheduling, and payroll reports for South Current Electric Inc.',
  generator: 'v0.app',
  applicationName: 'South Current Ops',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf5' },
    { media: '(prefers-color-scheme: dark)', color: '#2b2823' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cloudMode = isSupabaseConfigured()
  const initialData = cloudMode ? await loadCloudData() : null

  return (
    <html lang="en" className={`bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AppRuntime initialData={initialData} cloudMode={cloudMode}>
          {children}
        </AppRuntime>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
