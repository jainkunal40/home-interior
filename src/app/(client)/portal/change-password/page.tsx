'use client'

import { useActionState } from 'react'
import { changePassword } from '@/actions/settings'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(changePassword, null)

  return (
    <div className="space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your portal login password</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
            )}
            {state?.success && (
              <div className="p-2 rounded-lg bg-green-50 text-green-700 text-sm">{state.message}</div>
            )}
            <Input name="currentPassword" label="Current Password" type="password" required />
            <Input name="newPassword" label="New Password" type="password" required />
            <Input name="confirmPassword" label="Confirm New Password" type="password" required />
            <Button type="submit" disabled={pending}>
              {pending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
