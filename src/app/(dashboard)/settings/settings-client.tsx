'use client'

import { useState, useActionState } from 'react'
import { updateProfile, changePassword } from '@/actions/settings'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function SettingsClient({ user }: { user: any }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, null)
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, null)
  const [channel, setChannel] = useState<string>(user.notificationChannel || 'none')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Profile</h2>
            <Badge className="bg-brand-50 text-brand-700 capitalize">{user.role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            {profileState?.error && (
              <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{profileState.error}</div>
            )}
            {profileState?.success && (
              <div className="p-2 rounded-lg bg-green-50 text-green-700 text-sm">{profileState.message}</div>
            )}
            <Input name="name" label="Full Name" defaultValue={user.name} required />
            <Input name="email" label="Email" type="email" defaultValue={user.email} required />

            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">NOTIFICATIONS</p>
              <Select
                name="notificationChannel"
                label="Notification Channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                options={[
                  { value: 'none', label: 'Off — No notifications' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'telegram', label: 'Telegram' },
                ]}
              />
              {channel === 'whatsapp' && (
                <div className="mt-3">
                  <Input name="phone" label="WhatsApp Number" type="tel" defaultValue={user.phone || ''} placeholder="e.g. 9876543210" />
                  <p className="text-xs text-gray-400 mt-1">Include country code for non-Indian numbers.</p>
                </div>
              )}
              {channel === 'telegram' && (
                <div className="mt-3">
                  <Input name="telegramChatId" label="Telegram Chat ID" defaultValue={user.telegramChatId || ''} placeholder="e.g. 123456789" />
                  <p className="text-xs text-gray-400 mt-1">
                    Message your bot on Telegram, then visit <span className="font-mono">https://api.telegram.org/bot{'<TOKEN>'}/getUpdates</span> to find your chat ID.
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Member since {format(new Date(user.createdAt), 'dd MMM yyyy')}
            </p>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? 'Saving...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-4">
            {passwordState?.error && (
              <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{passwordState.error}</div>
            )}
            {passwordState?.success && (
              <div className="p-2 rounded-lg bg-green-50 text-green-700 text-sm">{passwordState.message}</div>
            )}
            <Input name="currentPassword" label="Current Password" type="password" required />
            <Input name="newPassword" label="New Password" type="password" required />
            <Input name="confirmPassword" label="Confirm New Password" type="password" required />
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">About Explore Interiors</h2>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Explore Interiors — Finance tracker for interior designers</p>
            <p>Version 1.0.0</p>
            <p className="text-xs text-gray-400 mt-2">
              All financial data is stored securely. Currency: Indian Rupee (₹)
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Designed & Developed by</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">Kunal Jain</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
