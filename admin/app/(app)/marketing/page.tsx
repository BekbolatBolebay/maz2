import { getPromoCodes, getBanners } from '@/lib/db'
import MarketingClient from './marketing-client'

export default async function MarketingPage() {
  const [promoCodes, banners] = await Promise.all([
    getPromoCodes(),
    getBanners(),
  ])

  return (
    <MarketingClient
      initialPromoCodes={promoCodes}
      initialBanners={banners}
    />
  )
}
