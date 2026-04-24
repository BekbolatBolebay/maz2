import { getCafeSettings, getWorkingHours, getUserProfile, getCurrentRestaurantId } from '@/lib/db'
import ProfileClient from './profile-client'

export default async function ProfilePage() {
  const restaurantId = await getCurrentRestaurantId()

  const [settings, hours, userProfile] = await Promise.all([
    getCafeSettings(restaurantId || undefined),
    getWorkingHours(restaurantId || undefined),
    getUserProfile()
  ])

  return <ProfileClient settings={settings} workingHours={hours} userProfile={userProfile} />
}
