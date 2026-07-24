'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKey } from './config'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = getSupabasePublishableKey()

  if (!url || !publishableKey) {
    throw new Error('Supabase environment variables are not configured.')
  }

  browserClient ??= createBrowserClient(url, publishableKey)
  return browserClient
}
