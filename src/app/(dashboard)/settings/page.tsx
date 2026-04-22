import { getUserProfile, getPreferences } from '@/actions/settings'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const [user, preferences] = await Promise.all([getUserProfile(), getPreferences()])
  if (!user) return null
  return <SettingsClient user={user} preferences={preferences} />
}
