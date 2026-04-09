// Booking cart — бөлек корзина (жеткізу корзинасынан бөлек)
// localStorage key: 'booking_cart'

export interface BookingCartItem {
    id: string
    menu_item_id: string
    cafe_id: string
    quantity: number
    name_kk: string
    name_ru: string
    price: number
    image_url: string
}

export function getBookingCart(): BookingCartItem[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('booking_cart')
    return stored ? JSON.parse(stored) : []
}

export function saveBookingCart(cart: BookingCartItem[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem('booking_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('bookingCartUpdated'))
}

export function addToBookingCart(item: BookingCartItem) {
    const cart = getBookingCart()
    const idx = cart.findIndex(i => i.menu_item_id === item.menu_item_id)
    if (idx >= 0) {
        cart[idx].quantity += item.quantity
    } else {
        cart.push(item)
    }
    saveBookingCart(cart)
}

export function updateBookingCartQuantity(itemId: string, quantity: number) {
    const cart = getBookingCart()
    const item = cart.find(i => i.id === itemId)
    if (item) {
        if (quantity <= 0) {
            saveBookingCart(cart.filter(i => i.id !== itemId))
        } else {
            item.quantity = quantity
            saveBookingCart(cart)
        }
    }
}

export function clearBookingCart() {
    if (typeof window === 'undefined') return
    localStorage.setItem('booking_cart', JSON.stringify([]))
    window.dispatchEvent(new Event('bookingCartUpdated'))
}
