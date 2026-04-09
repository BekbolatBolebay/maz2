// Local storage utilities for client app (no authentication required)

export interface LocalUser {
  id: string
  phone?: string
  name?: string
  created_at: string
}

export interface LocalCartItem {
  id: string
  menu_item_id: string
  cafe_id: string
  quantity: number
  menu_item: {
    name_kk: string
    name_ru: string
    name_en: string
    price: number
    image_url: string
    restaurant: {
      name_kk: string
      name_ru: string
      name_en: string
    }
  }
}

export interface LocalOrder {
  id: string
  cafe_id: string
  items: Array<{
    menu_item_id: string
    quantity: number
    price: number
    name_kk: string
    name_ru: string
    name_en: string
  }>
  total_amount: number
  delivery_address?: string
  phone: string
  status: string
  created_at: string
  restaurant: {
    name_kk: string
    name_ru: string
    name_en: string
    address_ru: string
    address_en: string
    phone: string
  }
}

// Generate unique user ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create local user
export function getLocalUser(): LocalUser {
  if (typeof window === 'undefined') return { id: '', created_at: '' }

  const stored = localStorage.getItem('local_user')
  if (stored) {
    return JSON.parse(stored)
  }

  const newUser: LocalUser = {
    id: generateUserId(),
    created_at: new Date().toISOString()
  }
  localStorage.setItem('local_user', JSON.stringify(newUser))
  return newUser
}

// Update local user info
export function updateLocalUser(data: Partial<LocalUser>) {
  if (typeof window === 'undefined') return

  const user = getLocalUser()
  const updated = { ...user, ...data }
  localStorage.setItem('local_user', JSON.stringify(updated))
}

// Cart management
export function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem('local_cart')
  return stored ? JSON.parse(stored) : []
}

export function saveLocalCart(cart: LocalCartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('local_cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export function addToLocalCart(item: LocalCartItem, force = false): { success: boolean, mismatch?: boolean } {
  const cart = getLocalCart()

  if (cart.length > 0 && cart[0].cafe_id !== item.cafe_id && !force) {
    return { success: false, mismatch: true }
  }

  const newCart = force ? [] : [...cart]
  const existingIndex = newCart.findIndex(
    i => i.menu_item_id === item.menu_item_id && i.cafe_id === item.cafe_id
  )

  if (existingIndex >= 0) {
    newCart[existingIndex].quantity += item.quantity
  } else {
    newCart.push(item)
  }

  saveLocalCart(newCart)
  return { success: true }
}

export function updateCartItemQuantity(itemId: string, quantity: number) {
  const cart = getLocalCart()
  const item = cart.find(i => i.id === itemId)

  if (item) {
    if (quantity <= 0) {
      saveLocalCart(cart.filter(i => i.id !== itemId))
    } else {
      item.quantity = quantity
      saveLocalCart(cart)
    }
  }
}

export function removeFromLocalCart(itemId: string) {
  const cart = getLocalCart()
  saveLocalCart(cart.filter(i => i.id !== itemId))
}

export function clearLocalCart() {
  if (typeof window === 'undefined') return
  localStorage.setItem('local_cart', JSON.stringify([]))
  window.dispatchEvent(new Event('cartUpdated'))
}

// Favorites management
export function getLocalFavorites(): string[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem('local_favorites')
  return stored ? JSON.parse(stored) : []
}

export function toggleLocalFavorite(cafeId: string): boolean {
  const favorites = getLocalFavorites()
  const index = favorites.indexOf(cafeId)

  if (index >= 0) {
    favorites.splice(index, 1)
    localStorage.setItem('local_favorites', JSON.stringify(favorites))
    window.dispatchEvent(new Event('favoritesUpdated'))
    return false
  } else {
    favorites.push(cafeId)
    localStorage.setItem('local_favorites', JSON.stringify(favorites))
    window.dispatchEvent(new Event('favoritesUpdated'))
    return true
  }
}

export function isLocalFavorite(cafeId: string): boolean {
  return getLocalFavorites().includes(cafeId)
}

// Food Favorites management
export function getLocalFoodFavorites(): string[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem('local_food_favorites')
  return stored ? JSON.parse(stored) : []
}

export function toggleLocalFoodFavorite(menuItemId: string): boolean {
  const favorites = getLocalFoodFavorites()
  const index = favorites.indexOf(menuItemId)

  if (index >= 0) {
    favorites.splice(index, 1)
    localStorage.setItem('local_food_favorites', JSON.stringify(favorites))
    window.dispatchEvent(new Event('favoritesUpdated'))
    return false
  } else {
    favorites.push(menuItemId)
    localStorage.setItem('local_food_favorites', JSON.stringify(favorites))
    window.dispatchEvent(new Event('favoritesUpdated'))
    return true
  }
}

export function isLocalFoodFavorite(menuItemId: string): boolean {
  return getLocalFoodFavorites().includes(menuItemId)
}

// Orders history
export function getLocalOrders(): LocalOrder[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem('local_orders')
  return stored ? JSON.parse(stored) : []
}

export function saveLocalOrder(order: LocalOrder) {
  const orders = getLocalOrders()
  orders.unshift(order)
  localStorage.setItem('local_orders', JSON.stringify(orders))
}

export function updateLocalOrderStatus(orderId: string, status: string) {
  const orders = getLocalOrders()
  const order = orders.find(o => o.id === orderId)

  if (order) {
    order.status = status
    localStorage.setItem('local_orders', JSON.stringify(orders))
  }
}

// Clear all local data
export function clearAllLocalData() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('local_cart')
  localStorage.removeItem('local_favorites')
  localStorage.removeItem('local_food_favorites')
  localStorage.removeItem('local_orders')
  window.dispatchEvent(new Event('cartUpdated'))
  window.dispatchEvent(new Event('favoritesUpdated'))
}
