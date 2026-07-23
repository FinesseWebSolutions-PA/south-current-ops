'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password'))
    const confirmation = String(data.get('confirmation'))
    if (password.length < 12) {
      setError('Use at least 12 characters.')
      setPending(false)
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match.')
      setPending(false)
      return
    }
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setPending(false)
      return
    }
    window.location.href = '/'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Use at least 12 characters and a unique password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updatePassword} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmation">Confirm password</Label>
              <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
