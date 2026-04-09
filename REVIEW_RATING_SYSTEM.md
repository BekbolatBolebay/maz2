# Review & Rating System - Comprehensive Documentation

## Overview
This is a complete review and rating system for a Next.js food ordering app built with Supabase. The system allows customers to rate orders and leave feedback, while restaurant owners can view and respond to reviews.

---

## 1. Database Schema

### Reviews Table
**Location:** `public.reviews`

```sql
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  reply TEXT DEFAULT '',
  replied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique review identifier
- `cafe_id`: Reference to restaurant
- `order_id`: Reference to the order being reviewed
- `customer_name`: Customer's display name
- `customer_avatar`: Optional customer avatar URL
- `rating`: Star rating (1-5)
- `comment`: Customer's written review
- `reply`: Restaurant owner's response
- `replied_at`: Timestamp of owner's reply
- `created_at`: When the review was created

### Restaurants Table (Rating Field)
**Location:** `public.restaurants`

The restaurant rating is stored as:
```sql
rating DECIMAL(2,1) DEFAULT 0.0
```

**Note:** The rating appears to be a static field that stores the average/aggregate rating, but no automatic trigger updates it. Rating updates may need to be calculated manually or through an API call.

---

## 2. Review Creation Flow

### Client Component: Order Rating
**Location:** [client/components/orders/order-rating.tsx](client/components/orders/order-rating.tsx)

**Features:**
- 5-star rating selector with interactive stars
- Optional text comment field
- Validates that a rating is selected before submission
- Shows success state after submission

**Key Code:**
```tsx
interface OrderRatingProps {
    orderId: string
    restaurantId: string
    customerName: string
    initialRating?: number
    initialComment?: string
}

export function OrderRating({
    orderId,
    restaurantId,
    customerName,
    initialRating = 0,
    initialComment = ''
}: OrderRatingProps)
```

**Submission Logic:**
```tsx
const handleSubmit = async () => {
    if (rating === 0) {
        toast.error(t.orders.selectStarToast)
        return
    }
    setIsSubmitting(true)
    try {
        const { error, data } = await supabase
            .from('reviews')
            .insert({
                cafe_id: restaurantId,
                customer_name: customerName,
                rating,
                comment,
                order_id: orderId,
            })
            .select()
        // Handle success/error
    }
}
```

### Where it's Used
**Location:** [client/app/orders/[id]/page.tsx](client/app/orders/%5Bid%5D/page.tsx)

The OrderRating component is displayed on the order detail page after an order is delivered or completed:

```tsx
{(order.status === 'delivered' || order.status === 'completed') && (
    <OrderRating
        orderId={order.id}
        restaurantId={order.cafe_id}
        customerName={order.customer_name || t.common.client}
        initialRating={existingReview?.rating}
        initialComment={existingReview?.comment}
    />
)}
```

---

## 3. Rating Display in UI

### Restaurant Page Display
**Location:** [client/app/restaurant/[id]/page.tsx](client/app/restaurant/%5Bid%5D/page.tsx)

Shows restaurant rating with star icon:
```tsx
<div className="flex items-center gap-1 ml-2">
    <Star className="w-5 h-5 fill-accent text-accent" />
    <span className="text-lg font-bold">{restaurant.rating.toFixed(1)}</span>
</div>
```

### Restaurants List Display
**Location:** [client/app/restaurants/page.tsx](client/app/restaurants/page.tsx)

Restaurants are queried with their rating:
```tsx
.select('*, restaurants!inner(id, name_ru, name_en, name_kk, city, rating, is_open)')
```

Supports sorting by rating:
```tsx
else if (sort === 'rating_desc') {
    // Rating sort implemented (may require client-side sorting)
    query = query.order('rating', { ascending: false })
}
```

---

## 4. Review Management (Admin)

### Admin Reviews Page - Restaurant Owner View
**Location:** [admin/app/(app)/reviews/reviews-client.tsx](admin/app/%28app%29/reviews/reviews-client.tsx)

**Features:**
- Displays all reviews for the restaurant
- Shows customer name, avatar, and timestamp
- Displays star rating visually
- Shows customer comment
- Restaurant owner can reply to reviews
- Real-time updates via Supabase subscriptions
- Edit/delete reply functionality

**Real-time Subscription:**
```tsx
const channel = supabase
    .channel(`reviews-realtime-${restaurant.id}`)
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews',
        filter: `cafe_id=eq.${restaurant.id}`
    }, (payload) => {
        console.log('[Reviews] New review detected:', payload.new.id)
        setReviews((prev) => [payload.new as Review, ...prev])
        toast.success(lang === 'kk' ? 'Жаңа пікір!' : 'Новый отзыв!')
    })
    .subscribe()
```

**Reply Functionality:**
```tsx
async function sendReply() {
    if (!replyingTo || !replyText.trim()) return
    const now = new Date().toISOString()
    const { error } = await supabase
        .from('reviews')
        .update({
            reply: replyText,
            replied_at: now,
        })
        .eq('id', replyingTo.id)
    // Handle result
}
```

### Admin Reviews UI Components
**Location:** [admin/app/(app)/reviews/page.tsx](admin/app/%28app%29/reviews/page.tsx)

Fetches reviews and restaurant settings:
```tsx
export default async function ReviewsPage() {
    const [reviews, restaurant] = await Promise.all([
        getReviews(),
        getCafeSettings()
    ])
    return (
        <ReviewsClient initialReviews={reviews} restaurant={restaurant} />
    )
}
```

**Review Card Display:**
- Customer avatar (with fallback icon)
- Customer name and timestamp
- 5-star rating display
- Review comment text
- Reply box (if no reply yet) or edit reply (if replied)
- Time ago formatting (e.g., "2 hours ago")

---

## 5. Database Type Definitions

### Review Type
**Location:** [admin/lib/db.ts](admin/lib/db.ts) & [client/lib/cafe-db.ts](client/lib/cafe-db.ts)

```typescript
export interface Review {
  id: string
  cafe_id: string
  order_id: string
  customer_name: string
  customer_avatar?: string
  rating: number  // 1-5
  comment: string
  reply?: string
  replied_at?: string
  created_at: string
}

export interface Restaurant {
  id: string
  name_kk: string
  name_ru: string
  name_en: string
  rating: number  // DECIMAL(2,1) - e.g., 4.5
  // ... other fields
}
```

---

## 6. Row Level Security (RLS)

### Review Table Policies
**Location:** [admin/scripts/fix_reviews_rls.sql](admin/scripts/fix_reviews_rls.sql)

```sql
-- Allow anyone to insert reviews
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Allow anyone to view reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
```

**Current Configuration:** Reviews can be inserted and viewed by anyone (no authentication required for viewing/submitting)

---

## 7. API Endpoints

### Client API - Admin Reviews
**Location:** [client/app/admin/reviews/page.tsx](client/app/admin/reviews/page.tsx)

**Endpoints:**
- `GET /api/admin/reviews` - Fetch all reviews
- `PUT /api/admin/reviews` - Update review reply

**Example POST Request:**
```javascript
const res = await fetch('/api/admin/reviews', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        id: reviewId, 
        reply: replyText 
    })
})
```

---

## 8. Multi-language Support

### Translation Keys
**Location:** [client/lib/i18n/translations.ts](client/lib/i18n/translations.ts)

**Review-related translations:**
- `orders.rateOrder` - "Rate order"
- `orders.rateDesc` - "Your feedback is important to us"
- `orders.selectStarToast` - "Please select a rating"
- `orders.reviewThanksToast` - "Thanks for your feedback!"
- `orders.reviewPlaceholder` - "Leave a comment (optional)..."
- `orders.ratingSubmitted` - "Feedback received. Thanks!"
- `restaurant.reviews` - "Reviews"
- `restaurant.rating` - "Rating"

**Supported Languages:**
- English
- Russian (Русский)
- Kazakh (Қазақ)

---

## 9. Key Files Summary

| File | Location | Purpose |
|------|----------|---------|
| Order Rating Component | `client/components/orders/order-rating.tsx` | Rating submission UI |
| Restaurant Page | `client/app/restaurant/[id]/page.tsx` | Display restaurant rating |
| Order Details Page | `client/app/orders/[id]/page.tsx` | Show rating component for delivered orders |
| Admin Reviews (Restaurant) | `admin/app/(app)/reviews/reviews-client.tsx` | Restaurant owner review management |
| Admin Reviews Page | `admin/app/(app)/reviews/page.tsx` | Server-side reviews fetching |
| Reviews Table Schema | `client/scripts/consolidated_setup.sql` | Database table definition |
| Review RLS Policies | `admin/scripts/fix_reviews_rls.sql` | Row-level security configuration |
| Database Types | `admin/lib/db.ts` | TypeScript interfaces |
| Translations | `client/lib/i18n/translations.ts` | Multi-language support |

---

## 10. Features & Capabilities

✅ **Implemented:**
- 5-star rating system
- Customer reviews with optional comments
- Restaurant owner replies to reviews
- Real-time review notifications
- Multi-language support (EN, RU, KK)
- Review history tracking (timestamps)
- Customer avatar storage
- Real-time Supabase subscriptions for new reviews

⚠️ **Notes:**
- **Rating Aggregation:** The restaurant `rating` field appears to be static. No automatic trigger updates it from reviews. You may need to:
  - Manually calculate and update the average rating
  - Create a database trigger to auto-update `restaurants.rating` when reviews are inserted
  - Implement an API endpoint to recalculate ratings
  
---

## 11. Recommended Enhancements

1. **Auto-calculate Restaurant Rating**
   - Create a database trigger to update `restaurants.rating` as an average of all `reviews.rating` values
   - Or create a scheduled job to recalculate ratings

2. **Review Moderation**
   - Add admin approval status for reviews
   - Implement spam detection

3. **Review Analytics**
   - Show rating distribution (how many 5-star, 4-star, etc.)
   - Track review trends over time

4. **Review Filtering**
   - Sort by most recent, highest rated, lowest rated
   - Filter by date range

5. **Review Images**
   - Allow customers to upload photos with reviews
   - Add image validation and storage

6. **Review Verification**
   - Show verified purchase badge
   - Ensure reviews are only from actual customers
