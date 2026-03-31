import { getUserProfile } from '@/actions/settings'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const user = await getUserProfile()
  if (!user) return null
  return <SettingsClient user={user} />
}
