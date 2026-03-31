'use client'

import { useActionState } from 'react'
import { signupAction } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-2xl font-bold mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SiteBooks</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <form action={formAction} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sign Up</h2>

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
          )}

          <Input name="name" label="Full Name" placeholder="Rahul Sharma" required />
          <Input name="email" type="email" label="Email" placeholder="you@studio.com" required />
          <Input name="password" type="password" label="Password" placeholder="Min 6 characters" required minLength={6} />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
