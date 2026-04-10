# Local Storage Architecture

## Overview

This app uses **local storage** for client data persistence. No authentication is required for the client app - all data is stored directly in the browser's local storage.

## Key Features

- ✅ No authentication required
- ✅ All data cached on device
- ✅ Works offline
- ✅ Anonymous usage
- ✅ Fast performance

## Data Stored Locally

### 1. User Profile (optional)
- User ID (auto-generated)
- Phone number (if provided)
- Name (if provided)

### 2. Shopping Cart
- Menu items
- Quantities
- Restaurant info
- Real-time updates across tabs

### 3. Favorites
- Restaurant IDs
- Menu Item (Food) IDs
- Persistent favorites list

### 4. Order History
- Past orders
- Order status
- Restaurant details

## API Usage

The client app can:
- **Read** restaurant and menu data from public APIs
- **Create** orders (stored locally until sent to server)
- **No authentication** needed for browsing and shopping

## Admin Panel Integration

The admin panel (separate codebase) uses the full API with authentication:
- Manage restaurants: `/api/admin/restaurants`
- Manage menu items: `/api/admin/menu-items`
- Update order status: `/api/admin/orders`
- View analytics: `/api/admin/stats`

## Local Storage Functions

```typescript
// User management
getLocalUser() - Get or create anonymous user
updateLocalUser(data) - Update user profile

// Cart management
getLocalCart() - Get cart items
addToLocalCart(item) - Add item to cart
updateCartItemQuantity(id, qty) - Update quantity
removeFromLocalCart(id) - Remove item
clearLocalCart() - Empty cart

// Favorites
getLocalFavorites() - Get favorite restaurant IDs
toggleLocalFavorite(restaurantId) - Add/remove favorite
isLocalFavorite(restaurantId) - Check if favorited

// Orders
getLocalOrders() - Get order history
saveLocalOrder(order) - Save new order
updateLocalOrderStatus(id, status) - Update status

// Clear all data
clearAllLocalData() - Reset everything
```

## Data Sync (Optional)

When users place orders, data is sent to the server but also kept locally for history. The server assigns real order IDs that are tracked locally.

## Benefits

1. **Privacy**: No personal data collected unless voluntarily provided
2. **Speed**: Instant access to cart and favorites
3. **Offline**: Browse menu and build cart offline
4. **Simple**: No login hassles for users
5. **Scalable**: Reduces server load

## Limitations

1. Data is device-specific (not synced across devices)
2. Data lost if browser cache is cleared
3. No order tracking across devices
4. Limited to browser storage limits (~10MB)

## Migration Path

If you want to add authentication later:
1. Keep local storage as fallback
2. Sync local cart to server on login
3. Merge favorites after authentication
4. Import order history to user account
