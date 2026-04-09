# Admin API Documentation

All admin API endpoints require authentication with an admin role user. Include the Supabase session token in the Authorization header.

## Authentication

```
Authorization: Bearer <supabase_access_token>
```

Users must have `role: 'admin'` in the `users` table.

---

## Restaurants API

### GET /api/admin/restaurants
Get all restaurants.

**Response:**
```json
{
  "restaurants": [
    {
      "id": "uuid",
      "name_en": "Restaurant Name",
      "name_ru": "Название ресторана",
      "description_en": "Description",
      "description_ru": "Описание",
      "address": "Address",
      "phone": "+1234567890",
      "image_url": "https://...",
      "rating": 4.5,
      "delivery_time": "25-35 мин",
      "delivery_fee": 500,
      "min_order": 1000,
      "is_open": true,
      "opening_hours": "08:00-22:00",
      "categories": ["Burgers", "Pizza"],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/admin/restaurants
Create a new restaurant.

**Request Body:**
```json
{
  "name_en": "Restaurant Name",
  "name_ru": "Название ресторана",
  "description_en": "Description",
  "description_ru": "Описание",
  "address": "Address",
  "phone": "+1234567890",
  "image_url": "https://...",
  "rating": 4.5,
  "delivery_time": "25-35 мин",
  "delivery_fee": 500,
  "min_order": 1000,
  "is_open": true,
  "opening_hours": "08:00-22:00",
  "categories": ["Burgers", "Pizza"]
}
```

### PUT /api/admin/restaurants
Update an existing restaurant.

**Request Body:**
```json
{
  "id": "uuid",
  "name_en": "Updated Name",
  "is_open": false
  // ... any fields to update
}
```

### DELETE /api/admin/restaurants?id=uuid
Delete a restaurant.

---

## Menu Items API

### GET /api/admin/menu-items
Get all menu items. Optional query param: `cafe_id`.

**Query Parameters:**
- `cafe_id` (optional): Filter by restaurant

**Response:**
```json
{
  "menuItems": [
    {
      "id": "uuid",
      "cafe_id": "uuid",
      "name_en": "Burger",
      "name_ru": "Бургер",
      "description_en": "Description",
      "description_ru": "Описание",
      "price": 2500,
      "image_url": "https://...",
      "category": "Burgers",
      "is_available": true,
      "is_popular": true,
      "restaurants": {
        "name_en": "Restaurant Name",
        "name_ru": "Название"
      }
    }
  ]
}
```

### POST /api/admin/menu-items
Create a new menu item.

**Request Body:**
```json
{
  "cafe_id": "uuid",
  "name_en": "Burger",
  "name_ru": "Бургер",
  "description_en": "Description",
  "description_ru": "Описание",
  "price": 2500,
  "image_url": "https://...",
  "category": "Burgers",
  "is_available": true,
  "is_popular": false
}
```

### PUT /api/admin/menu-items
Update a menu item.

**Request Body:**
```json
{
  "id": "uuid",
  "price": 2800,
  "is_available": false
  // ... any fields to update
}
```

### DELETE /api/admin/menu-items?id=uuid
Delete a menu item.

---

## Orders API

### GET /api/admin/orders
Get all orders.

**Query Parameters:**
- `status` (optional): Filter by status (pending, preparing, on_the_way, delivered, cancelled)
- `cafe_id` (optional): Filter by restaurant
- `limit` (optional): Limit number of results

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "cafe_id": "uuid",
      "status": "preparing",
      "total_amount": 5500,
      "delivery_fee": 500,
      "subtotal": 5000,
      "delivery_address": "Address",
      "delivery_type": "delivery",
      "estimated_delivery": "14:30",
      "created_at": "2025-01-15T13:00:00Z",
      "users": {
        "full_name": "User Name",
        "phone": "+1234567890"
      },
      "restaurants": {
        "name_en": "Restaurant",
        "name_ru": "Ресторан",
        "phone": "+1234567890"
      },
      "order_items": [...]
    }
  ]
}
```

### PUT /api/admin/orders
Update order status.

**Request Body:**
```json
{
  "id": "uuid",
  "status": "on_the_way",
  "estimated_delivery": "14:45"
}
```

**Valid Statuses:**
- `pending`: Order placed, waiting
- `preparing`: Restaurant is preparing
- `on_the_way`: Out for delivery
- `delivered`: Delivered to customer
- `cancelled`: Order cancelled

### DELETE /api/admin/orders?id=uuid
Cancel an order (sets status to 'cancelled').

---

## Promotions API

### GET /api/admin/promotions
Get all promotions.

**Response:**
```json
{
  "promotions": [
    {
      "id": "uuid",
      "title_en": "20% Off",
      "title_ru": "Скидка 20%",
      "description_en": "Description",
      "description_ru": "Описание",
      "discount_percent": 20,
      "code": "SAVE20",
      "image_url": "https://...",
      "valid_from": "2025-01-01T00:00:00Z",
      "valid_until": "2025-01-31T23:59:59Z",
      "is_active": true,
      "min_order_amount": 2000,
      "max_discount": 1000
    }
  ]
}
```

### POST /api/admin/promotions
Create a new promotion.

**Request Body:**
```json
{
  "title_en": "20% Off",
  "title_ru": "Скидка 20%",
  "description_en": "Description",
  "description_ru": "Описание",
  "discount_percent": 20,
  "code": "SAVE20",
  "image_url": "https://...",
  "valid_from": "2025-01-01T00:00:00Z",
  "valid_until": "2025-01-31T23:59:59Z",
  "is_active": true,
  "min_order_amount": 2000,
  "max_discount": 1000
}
```

### PUT /api/admin/promotions
Update a promotion.

### DELETE /api/admin/promotions?id=uuid
Delete a promotion.

---

## Users API

### GET /api/admin/users
Get all users.

**Query Parameters:**
- `role` (optional): Filter by role (user, admin)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "User Name",
      "phone": "+1234567890",
      "role": "user",
      "avatar_url": "https://...",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### PUT /api/admin/users
Update user role.

**Request Body:**
```json
{
  "id": "uuid",
  "role": "admin"
}
```

**Valid Roles:**
- `user`: Regular user
- `admin`: Administrator

---

## Statistics API

### GET /api/admin/stats
Get dashboard statistics.

**Response:**
```json
{
  "stats": {
    "totalOrders": 150,
    "activeOrders": 12,
    "totalRevenue": 450000,
    "totalUsers": 85,
    "totalRestaurants": 15,
    "todayOrders": 25,
    "recentOrders": [...],
    "restaurantCounts": {
      "uuid-1": 45,
      "uuid-2": 38
    }
  }
}
```

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `403`: Unauthorized (not admin)
- `500`: Internal Server Error

---

## Notes

1. All prices are in smallest currency units (e.g., cents/tenge)
2. All timestamps are in ISO 8601 format
3. UUIDs are used for all IDs
4. Bilingual content requires both `_en` and `_ru` fields
5. Real-time updates are sent via Supabase Realtime when orders are updated
