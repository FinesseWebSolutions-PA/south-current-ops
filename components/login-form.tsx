'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export function LoginForm() {
  const configured = isSupabaseConfigured()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email'))
    const password = String(data.get('password'))
    const { error: authError } = await createClient().auth.signInWithPassword({
      email,
      password,
    })
    if (authError) {
      setError(authError.message)
      setPending(false)
      return
    }
    window.location.href = '/'
  }

  async function resetPassword() {
    const email = (document.querySelector('[name="email"]') as HTMLInputElement | null)?.value
    if (!email) {
      setError('Enter your email address first.')
      return
    }
    setPending(true)
    setError('')
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(
      email,
      { redirectTo },
    )
    setPending(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setMessage('Check your email for a secure password-reset link.')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.65_0.135_82/0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <Card className="relative w-full max-w-md border-sidebar-border bg-card shadow-2xl">
        <CardHeader className="text-center">
          <Image
            src="/brand/south-current-mark.png"
            alt="South Current Electric Inc."
            width={104}
            height={104}
            className="mx-auto mb-1 size-24 object-contain"
            priority
          />
          <CardTitle className="text-xl font-bold">South Current Electric</CardTitle>
          <CardDescription>Operations · Jobs · Employee Time</CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
              Supabase is not configured yet. Add the two variables from
              <code className="mx-1">.env.example</code>
              in Vercel to enable employee accounts.
            </div>
          ) : (
            <form onSubmit={signIn} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-accent">{message}</p>}
              <Button type="submit" disabled={pending}>
                {pending ? 'Signing in…' : 'Sign in'}
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={resetPassword}>
                Forgot password?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
