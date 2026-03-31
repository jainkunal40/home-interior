'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-2xl font-bold mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SiteBooks</h1>
          <p className="text-sm text-gray-500 mt-1">Track your project finances</p>
        </div>

        <form action={formAction} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sign In</h2>

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
          )}

          <Input name="email" type="email" label="Email" placeholder="you@studio.com" required />
          <Input name="password" type="password" label="Password" placeholder="••••••••" required />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-600 font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
