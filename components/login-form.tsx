'use client'

import { useState, type FormEvent } from 'react'
import { Zap } from 'lucide-react'
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary">
            <Zap className="size-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">South Current Ops</CardTitle>
          <CardDescription>Sign in to manage jobs and record employee time.</CardDescription>
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
