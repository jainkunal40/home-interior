'use client'

import { useActionState } from 'react'
import { signupAction } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.jpg" alt="Explore Interiors" width={72} height={72} className="rounded-2xl mx-auto mb-3 shadow-lg" />
          <h1 className="text-2xl font-bold text-white">Explore Interiors</h1>
          <p className="text-sm text-dark-400 mt-1">Create your account</p>
        </div>

        <form action={formAction} className="space-y-4 bg-white p-6 rounded-2xl shadow-lg border border-brand-400/20">
          <h2 className="text-lg font-semibold text-dark-900">Sign Up</h2>

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
          )}

          <Input name="name" label="Full Name" placeholder="Rahul Sharma" required />
          <Input name="email" type="email" label="Email" placeholder="you@studio.com" required />
          <Input name="password" type="password" label="Password" placeholder="Min 6 characters" required minLength={6} />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-dark-500">
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
