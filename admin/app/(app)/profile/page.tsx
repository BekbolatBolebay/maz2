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
    const [rawConfig, vpsStatus] = await Promise.all([
      getMerchantConfig(settings.id),
      getRestaurantStatus(settings.id)
    ]);
    
    const config = rawConfig as any;
    if (config) {
      if (config.freedom_merchant_id !== undefined) settings.freedom_merchant_id = config.freedom_merchant_id;
      if (config.freedom_payment_secret_key !== undefined) settings.freedom_payment_secret_key = config.freedom_payment_secret_key;
      if (config.freedom_receipt_secret_key !== undefined) settings.freedom_receipt_secret_key = config.freedom_receipt_secret_key;
      if (config.kaspi_link !== undefined) settings.kaspi_link = config.kaspi_link;
      if (config.accept_freedom !== undefined) settings.accept_freedom = config.accept_freedom;
      if (config.accept_kaspi !== undefined) settings.accept_kaspi = config.accept_kaspi;
    }
    
    if (vpsStatus && vpsStatus.status !== undefined) {
      settings.status = vpsStatus.status;
    }
  }

  return <ProfileClient settings={settings} workingHours={hours} userProfile={userProfile} />
}
