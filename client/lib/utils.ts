import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCustomerValue(value: any, field: 'full_name' | 'phone' | 'address' = 'full_name'): string {
  if (!value) return ''
  if (typeof value !== 'string') return String(value)
  
  if (value.startsWith('db:')) {
    try {
      const jsonStr = value.slice(3)
      const data = JSON.parse(jsonStr)
      if (field === 'full_name') return data.full_name || data.name || value
      if (field === 'phone') return data.phone || data.tel || value
      if (field === 'address') return data.address || data.addr || data.delivery_address || value
      return value
    } catch (e) {
      return value
    }
  }
  return value
}
