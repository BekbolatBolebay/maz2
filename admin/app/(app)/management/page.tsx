import { getCafeSettings } from '@/lib/db'
import ManagementClient from './management-client'

export default async function ManagementPage() {
  const settings = await getCafeSettings()
  return <ManagementClient settings={settings} />
}
