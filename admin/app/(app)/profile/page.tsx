import { getCafeSettings, getWorkingHours, getUserProfile } from '@/lib/db'
import ProfileClient from './profile-client'

export default async function ProfilePage() {
  const [settings, hours, userProfile] = await Promise.all([
    getCafeSettings(),
    getWorkingHours(),
    getUserProfile()
  ])
  return <ProfileClient settings={settings} workingHours={hours} userProfile={userProfile} />
}
