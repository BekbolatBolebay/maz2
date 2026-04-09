import { getCafeSettings, getWorkingHours, getUserProfile } from '@/lib/db'
import ProfileClient from './profile-client'
import { getMerchantConfig, getRestaurantStatus } from '@/lib/vps'

export default async function ProfilePage() {
  const [settings, hours, userProfile] = await Promise.all([
    getCafeSettings(),
    getWorkingHours(),
    getUserProfile()
  ])

  // Hydrate with VPS data if restaurant exists
  if (settings) {
    const config = await getMerchantConfig(settings.id);
    if (config) {
      settings.freedom_merchant_id = config.freedom_merchant_id;
      settings.freedom_payment_secret_key = config.freedom_payment_secret_key;
      settings.freedom_receipt_secret_key = config.freedom_receipt_secret_key;
      settings.freedom_test_mode = config.freedom_test_mode;
      settings.kaspi_link = config.kaspi_link;
      settings.accept_freedom = config.accept_freedom;
      settings.accept_kaspi = config.accept_kaspi;
    }
    
    const vpsStatus = await getRestaurantStatus(settings.id);
    if (vpsStatus) {
      settings.status = vpsStatus.status;
    }
  }

  return <ProfileClient settings={settings} workingHours={hours} userProfile={userProfile} />
}
