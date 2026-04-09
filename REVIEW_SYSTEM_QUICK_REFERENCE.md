# Review/Rating System - Quick Reference Guide

## File Locations & Descriptions

### 📋 Database & Schema Files

#### Consolidated Setup (Main Schema)
- **File:** `client/scripts/consolidated_setup.sql`
- **Lines:** 308-324
- **Contains:** `reviews` table schema with all fields and constraints
- **Key Fields:** id, cafe_id, order_id, customer_name, rating (1-5), comment, reply, replied_at, created_at

#### Restaurant Table (Rating Storage)
- **File:** `client/scripts/consolidated_setup.sql`
- **Lines:** 51-100
- **Contains:** `restaurants` table with `rating DECIMAL(2,1)` field
- **Note:** Rating field stores aggregate rating but no auto-update trigger exists

#### Row Level Security (RLS)
- **File:** `admin/scripts/fix_reviews_rls.sql`
- **Policies:** INSERT and SELECT allowed for anyone
- **Use:** Ensures reviews can be submitted and viewed publicly

---

### 🎨 Client-Side Components

#### Order Rating Component (Review Submission)
- **File:** `client/components/orders/order-rating.tsx`
- **Type:** 'use client' React component
- **Features:**
  - 5-star interactive rating selector
  - Text comment textarea
  - Form validation (rating required)
  - Supabase insert operation
  - Success/error toast notifications
  - Disabled submit button shows state

#### Order Details Page (Rating Display Location)
- **File:** `client/app/orders/[id]/page.tsx`
- **Lines:** 293+ 
- **Shows:** OrderRating component for delivered/completed orders
- **Also fetches:** Existing review data to pre-populate form if edited

#### Restaurant Page (Rating Display)
- **File:** `client/app/restaurant/[id]/page.tsx`
- **Lines:** 122-124
- **Shows:** Star icon with restaurant.rating.toFixed(1)
- **Also displays:** Restaurant info, menu, working hours

#### Restaurants List Page (Rating Query)
- **File:** `client/app/restaurants/page.tsx`
- **Lines:** 54, 92-93, 190
- **Features:** 
  - Queries restaurants with rating field
  - Supports sorting by rating_desc
  - Shows rating in restaurant cards

---

### 🏪 Admin/Restaurant Owner Pages

#### Admin Reviews Main Page
- **File:** `admin/app/(app)/reviews/page.tsx`
- **Type:** Server component
- **Features:**
  - Fetches reviews via getReviews()
  - Fetches restaurant settings via getCafeSettings()
  - Passes data to ReviewsClient

#### Admin Reviews Client Component
- **File:** `admin/app/(app)/reviews/reviews-client.tsx`
- **Type:** 'use client' React component  
- **Features:**
  - Display all reviews for restaurant
  - Real-time Supabase subscription for new reviews
  - Reply to reviews functionality
  - Edit existing replies
  - Show customer avatars and timestamps
  - Multi-language support
  - Interactive star rating display

---

### 📱 Data Types & Interfaces

#### Review Type Definition
- **File:** `admin/lib/db.ts` (admin version)
- **Fields:**
  ```typescript
  id: string
  cafe_id: string
  order_id: string
  customer_name: string
  customer_avatar?: string
  rating: number (1-5)
  comment: string
  reply?: string
  replied_at?: string
  created_at: string
  ```

#### Cafe/Restaurant Type
- **File:** `client/lib/cafe-db.ts`
- **Fields:** Includes `rating: number`

---

### 🌐 Internationalization

#### Translation Strings
- **File:** `client/lib/i18n/translations.ts`
- **Languages:** English, Russian (Русский), Kazakh (Қазақ)
- **Review Keys:**
  - `orders.rateOrder` = "Rate order"
  - `orders.rateDesc` = "Your feedback is important to us"
  - `orders.selectStarToast` = "Please select a rating"
  - `orders.reviewThanksToast` = "Thanks for your feedback!"
  - `orders.reviewPlaceholder` = "Leave a comment (optional)..."
  - `orders.ratingSubmitted` = "Feedback received. Thanks!"
  - `restaurant.reviews` = "Reviews"
  - `restaurant.rating` = "Rating"

---

### 🔐 Security & Permissions

#### Client Permissions
- **INSERT:** ✅ Anyone can submit reviews
- **SELECT:** ✅ Anyone can view reviews
- **UPDATE:** ✅ Only replies can be updated
- **DELETE:** ❌ Not configured (reviews are permanent)

#### Authentication
- **Review submission:** No authentication required
- **Reply posting:** Likely restricted to restaurant owner
- **Admin page access:** Restricted to authenticated restaurant owner

---

## 📊 Data Flow Diagram

```
CUSTOMER SUBMITS REVIEW
        ↓
[OrderRating Component]
        ↓
User selects rating (1-5)
User enters optional comment
        ↓
[handleSubmit() function]
        ↓
supabase.from('reviews').insert({
    cafe_id: restaurantId,
    customer_name: customerName,
    rating: rating,
    comment: comment,
    order_id: orderId
})
        ↓
Review stored in database
Toast notification shown
        ↓
RESTAURANT OWNER SEES REVIEW
        ↓
[Real-time Supabase subscription]
        ↓
AdminReviewsClient component 
receives new review via postgres_changes
        ↓
Toast notification: "Новый отзыв!" / "New Review!"
        ↓
Reviews list updates immediately
        ↓
OWNER POSTS REPLY
        ↓
sendReply() function
        ↓
supabase.from('reviews').update({
    reply: replyText,
    replied_at: now
}).eq('id', reviewId)
        ↓
Reply stored and displayed
```

---

## 🔍 Key Functions & Methods

### Review Submission
**File:** `client/components/orders/order-rating.tsx`
```tsx
async handleSubmit() {
    // Validates rating is selected
    // Inserts review into Supabase
    // Shows success/error toast
    // Sets submitted state to true
}
```

### Reply to Review
**File:** `admin/app/(app)/reviews/reviews-client.tsx`
```tsx
async sendReply() {
    // Updates review with reply and timestamp
    // Updates local state
    // Shows success/error toast
    // Resets reply form
}
```

### Real-time Subscription
**File:** `admin/app/(app)/reviews/reviews-client.tsx`
```tsx
useEffect(() => {
    // Creates Supabase channel subscription
    // Listens for INSERT events on reviews table
    // Filters by cafe_id
    // Updates reviews state in real-time
})
```

---

## 🎯 Entry Points

### For Customers
1. Create order → Order gets delivered ✓
2. Order detail page appears with OrderRating component
3. Customer rates order and leaves comment
4. Review is stored

### For Restaurant Owners
1. Dashboard/management page
2. Navigate to Reviews section
3. See all reviews for restaurant
4. Real-time notifications for new reviews
5. Click to reply to each review
6. Replies are updated immediately

---

## ⚠️ Known Limitations

1. **No Auto-Rating Calculation**
   - `restaurants.rating` is static
   - Not automatically updated when reviews are added
   - Need manual trigger or API endpoint to update

2. **No Review Moderation**
   - Reviews post immediately
   - No spam/inappropriate content detection
   - No admin approval workflow

3. **No Deletion By Customer**
   - Reviews cannot be deleted by customer
   - Reviews cannot be edited by customer
   - Only restaurant can edit review (reply only)

4. **No Review Filtering**
   - Cannot sort reviews by rating, date, etc.
   - Cannot filter by date range
   - Displays all reviews chronologically

5. **No Review Images**
   - Only text comments supported
   - No image upload for reviews

---

## ✅ Testing Checklist

- [ ] Submit review with all fields (1-5 stars, comment)
- [ ] Submit review with missing comment (optional)
- [ ] Submit review with missing rating (should fail)
- [ ] View reviews as restaurant owner
- [ ] Receive real-time notification for new review
- [ ] Reply to review as owner
- [ ] Edit existing reply as owner
- [ ] View reply in customer's review (if applicable)
- [ ] Check review visibility in restaurant page
- [ ] Verify multi-language text displays correctly
- [ ] Test RLS policies with different user roles

---

## 🚀 Future Enhancement Ideas

1. **Average Rating Calculation** - Auto-update from reviews
2. **Review Moderation System** - Approve/reject reviews
3. **Spam Detection** - Automatic flagging of suspicious reviews
4. **Analytics Dashboard** - Rating trends and statistics
5. **Review Images** - Customer and owner can add photos
6. **Review Filtering** - Sort by date, rating, helpfulness
7. **Verified Purchases** - Badge for reviews from actual orders
8. **Review Pinning** - Owners can pin favorite reviews
9. **Review Responses** - Better threading for conversations
10. **Review Badges** - Different badges for types of customers

---

## 🔗 Related Files to Check

- API routes: `client/app/api/` and `admin/app/api/`
- Database functions: `lib/db.ts` files
- Supabase client setup: `lib/supabase/client.ts`
- Authentication: `lib/supabase/middleware.ts`
- UI components: Look in `components/restaurant/` for rating displays
