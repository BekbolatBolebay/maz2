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

export function isHappyHourActive(restaurant: any): boolean {
  if (!restaurant || !restaurant.happy_hour_start || !restaurant.happy_hour_end || !restaurant.happy_hour_discount_percent) {
    return false
  }

  const now = new Date()
  const day = now.getDay() // 0-6 (Sun-Sat)
  
  // Check if today is an active happy hour day
  if (restaurant.happy_hour_days && !restaurant.happy_hour_days.includes(day)) {
    return false
  }

  const currentTimeStr = now.toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5) // "HH:mm"
  
  const start = restaurant.happy_hour_start.slice(0, 5)
  const end = restaurant.happy_hour_end.slice(0, 5)

  if (start <= end) {
    return currentTimeStr >= start && currentTimeStr <= end
  } else {
    // Overlays midnight
    return currentTimeStr >= start || currentTimeStr <= end
  }
}

export function getHappyHourDiscountedPrice(price: number, restaurant: any): number {
  if (isHappyHourActive(restaurant)) {
    const discount = restaurant.happy_hour_discount_percent / 100
    return Math.round(price * (1 - discount))
  }
  return price
}
