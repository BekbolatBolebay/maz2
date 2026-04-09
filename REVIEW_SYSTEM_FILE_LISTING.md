# Review/Rating System - Complete File Listing

## 📁 File Structure Overview

```
REVIEW & RATING SYSTEM FILES
│
├─ DATABASE & SETUP
│  ├─ client/scripts/consolidated_setup.sql
│  │  ├─ Lines 51-100: restaurants table (rating: DECIMAL(2,1))
│  │  └─ Lines 308-324: reviews table (complete schema)
│  │
│  └─ admin/scripts/fix_reviews_rls.sql
│     ├─ INSERT policy: Anyone can insert reviews
│     └─ SELECT policy: Anyone can view reviews
│
├─ CLIENT-SIDE UI COMPONENTS  
│  ├─ client/components/orders/order-rating.tsx ⭐ KEY
│  │  ├─ 5-star interactive selector
│  │  ├─ Comment textarea
│  │  ├─ Form validation
│  │  └─ Supabase insert logic
│  │
│  ├─ client/app/orders/[id]/page.tsx
│  │  ├─ Displays OrderRating component for completed orders
│  │  └─ Fetches existing reviews for pre-population
│  │
│  ├─ client/app/restaurant/[id]/page.tsx
│  │  ├─ Shows restaurant.rating with star icon
│  │  └─ Part of restaurant detail view
│  │
│  └─ client/app/restaurants/page.tsx
│     ├─ Lists all restaurants with ratings
│     ├─ Supports rating sorting
│     └─ Queries rating field from restaurants table
│
├─ ADMIN/RESTAURANT OWNER PAGES
│  ├─ admin/app/(app)/reviews/page.tsx
│  │  ├─ Server component
│  │  ├─ Fetches reviews and restaurant settings
│  │  └─ Renders ReviewsClient
│  │
│  └─ admin/app/(app)/reviews/reviews-client.tsx ⭐ KEY
│     ├─ 'use client' component
│     ├─ Display all reviews with ratings/comments
│     ├─ Real-time Supabase subscriptions
│     ├─ Reply to reviews functionality
│     ├─ Show customer avatars
│     └─ Multi-language support
│
├─ ALTERNATIVE ADMIN REVIEWS (CLIENT VERSION)
│  └─ client/app/admin/reviews/page.tsx
│     ├─ Alternative admin review management
│     ├─ API-based (not real-time)
│     ├─ PUT /api/admin/reviews endpoint
│     └─ Displays reviews in card format
│
├─ DATABASE TYPES & INTERFACES
│  ├─ admin/lib/db.ts
│  │  └─ Review interface definition
│  │
│  ├─ client/lib/cafe-db.ts
│  │  └─ Cafe/Restaurant interface with rating field
│  │
│  └─ client/lib/supabase/types.ts
│     └─ Generated Supabase type definitions
│
├─ INTERNATIONALIZATION
│  ├─ client/lib/i18n/translations.ts
│  │  ├─ English (EN) review strings
│  │  ├─ Russian (RU) review strings  
│  │  └─ Kazakh (KK) review strings
│  │
│  └─ Lines with review keys:
│     ├─ 58: rating: 'Rating'
│     ├─ 65: reviews: 'Reviews'
│     ├─ 207: selectStarToast: 'Please select a rating'
│     ├─ 208: reviewThanksToast: 'Thanks for your feedback!'
│     ├─ 209: reviewPlaceholder: 'Leave a comment (optional)...'
│     ├─ 210: ratingSubmitted: 'Feedback received. Thanks!'
│     └─ Similar entries for RU and KK languages
│
├─ API ENDPOINTS
│  ├─ GET /api/admin/reviews
│  │  └─ Fetch all reviews (client/app/admin/reviews/page.tsx line 24)
│  │
│  └─ PUT /api/admin/reviews  
│     └─ Update review reply (client/app/admin/reviews/page.tsx line 39)
│
└─ UI UTILITIES & HELPERS
   ├─ client/lib/utils.ts
   │  └─ cn() function for className merging
   │
   ├─ client/components/ui/button.tsx
   │  └─ UI button component
   │
   ├─ client/components/ui/card.tsx
   │  └─ Card container component
   │
   ├─ client/components/ui/textarea.tsx
   │  └─ Textarea form input
   │
   ├─ client/lib/supabase/client.ts
   │  └─ Supabase client initialization
   │
   └─ client/lib/i18n/i18n-context.tsx
      └─ Translation context provider
```

---

## 🎯 Critical Files

### File #1: Order Rating Component (Submission)
**Path:** `client/components/orders/order-rating.tsx`
**Purpose:** Main component for customers to submit reviews
**Key Elements:**
- Star rating selector (1-5)
- Comment textarea
- Submit button with validation
- Success/error states
- Supabase insert: `.from('reviews').insert(...)`

### File #2: Admin Reviews Client (Viewing/Replying)
**Path:** `admin/app/(app)/reviews/reviews-client.tsx`
**Purpose:** Restaurant owner interface to manage reviews
**Key Elements:**
- Display all reviews with ratings
- Show customer info and timestamps
- Real-time notifications for new reviews
- Reply composing interface
- Edit existing replies
- Formatted times using date-fns

### File #3: Reviews Table Schema
**Path:** `client/scripts/consolidated_setup.sql` (lines 308-324)
**Purpose:** Database table definition
**Key Elements:**
- UUID primary key
- Foreign keys to restaurants and orders
- Rating constraint (1-5)
- Timestamps tracking
- Reply functionality fields

### File #4: Restaurant Rating Display
**Path:** `client/app/restaurant/[id]/page.tsx` (lines 122-124)
**Purpose:** Show restaurant rating in UI
**Key Elements:**
- Star icon display
- Rating value with 1 decimal place formatting
- Simple display of restaurants.rating field

---

## 🔄 Data Flow Paths

### Path 1: Submit Review (Customer)
```
Order delivered
    ↓
OrderRating component renders
    ↓
User clicks stars (1-5)
    ↓
User types optional comment
    ↓
User clicks "Submit"
    ↓
handleSubmit() validates
    ↓
Supabase INSERT to reviews table
    ↓
Success toast notification
    ↓
Component shows "Thank you" state
```

**Files involved:** 
- `client/components/orders/order-rating.tsx`
- `client/app/orders/[id]/page.tsx`
- `client/scripts/consolidated_setup.sql` (schema)

### Path 2: View & Reply (Restaurant Owner)
```
Dashboard → Reviews section
    ↓
Admin reviews page loads
    ↓
getReviews() fetches from DB
    ↓
ReviewsClient renders review cards
    ↓
Real-time subscription awaits new reviews
    ↓
Owner clicks "Reply" button
    ↓
Reply textarea appears
    ↓
Owner types reply
    ↓
Click "Send"
    ↓
sendReply() updates review
    ↓
Supabase UPDATE with reply + timestamp
    ↓
Updated review displays immediately
```

**Files involved:**
- `admin/app/(app)/reviews/page.tsx`
- `admin/app/(app)/reviews/reviews-client.tsx`
- `admin/lib/db.ts` (getReviews function)
- `client/scripts/consolidated_setup.sql` (schema)

### Path 3: Display Rating (Customer)
```
Restaurant page loads
    ↓
Query restaurants table
    ↓
Select rating field
    ↓
Render with Star icon
    ↓
Format to 1 decimal place
    ↓
Display: ⭐ 4.5
```

**Files involved:**
- `client/app/restaurant/[id]/page.tsx`
- `client/scripts/consolidated_setup.sql` (restaurants table)

---

## 📊 Component Dependencies

```
OrderRating
  ├─ useState (React)
  ├─ Star (lucide-react icon)
  ├─ Button (UI component)
  ├─ Card/CardContent (UI components)
  ├─ Textarea (UI component)
  ├─ createClient (Supabase)
  ├─ toast (sonner)
  ├─ cn (utils)
  └─ useI18n (context)

ReviewsClient  
  ├─ useState, useEffect (React)
  ├─ Icons (lucide-react)
  ├─ Link (Next.js)
  ├─ useApp (context)
  ├─ createClient (Supabase)
  ├─ Review type
  ├─ cn (utils)
  ├─ toast (sonner)
  └─ formatDistanceToNow (date-fns)

RestaurantPage
  ├─ Image (Next.js)
  ├─ Star (lucide-react)
  ├─ Badge (UI)
  ├─ Tabs (UI)
  ├─ createClient (Supabase)
  ├─ isRestaurantOpen (utils)
  └─ restaurant.rating (from database)
```

---

## 🔐 Security & Access Control

### Current Configuration

**Public Access:**
- ✅ INSERT reviews (anyone)
- ✅ SELECT reviews (anyone)
- ❌ DELETE reviews (not configured)
- ❌ UPDATE reviews (only for replies, likely auth-gated)

**Authentication:**
- No auth required for submitting reviews
- Auth required for admin review pages (implicit)
- Auth required for posting replies

**Data Validation:**
- Rating: Must be 1-5 (database constraint)
- Rating: Must be selected (form validation)
- Comment: Optional field
- customer_name: Required

---

## 🎨 UI Components Used

| Component | Location | Purpose |
|-----------|----------|---------|
| OrderRating | `client/components/orders/order-rating.tsx` | Review form |
| Star Icon | lucide-react | Visual rating display |
| Button | `client/components/ui/button.tsx` | Submit/reply buttons |
| Card | `client/components/ui/card.tsx` | Container for reviews |
| Textarea | `client/components/ui/textarea.tsx` | Comment input |
| Badge | `client/components/ui/badge.tsx` | Status badges |
| Toast | sonner | Notifications |

---

## 🌍 Localization Coverage

### English (EN)
- Review form labels
- Toast messages
- Placeholder text
- UI labels

### Russian (Русский)
- Full translation of all text
- Keyboard layout optimized
- Cultural adaptations

### Kazakh (Қазақ)
- Full translation
- Native language support
- Regional preferences

---

## ⚙️ Configuration & Setup

### Environment Variables
None specifically for reviews (inherits from Supabase config)

### Database Setup
Run: `client/scripts/consolidated_setup.sql`
- Creates reviews table
- Adds rating column to restaurants table
- Sets up RLS policies

### Initialization
1. Load consolidated_setup.sql
2. Run fix_reviews_rls.sql for RLS policies
3. Deploy client and admin apps

---

## 📝 Code Examples

### Example: Insert Review
```typescript
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
```

### Example: Fetch Reviews
```typescript
const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('cafe_id', restaurantId)
    .order('created_at', { ascending: false })
```

### Example: Post Reply
```typescript
const { error } = await supabase
    .from('reviews')
    .update({
        reply: replyText,
        replied_at: now,
    })
    .eq('id', reviewId)
```

### Example: Display Rating
```tsx
<div className="flex items-center gap-1">
    <Star className="w-5 h-5 fill-accent text-accent" />
    <span className="text-lg font-bold">
        {restaurant.rating.toFixed(1)}
    </span>
</div>
```

---

## 🚨 Known Issues & Limitations

1. **No Automatic Rating Calculation**
   - `restaurants.rating` field exists but isn't auto-updated
   - Manual update needed when new reviews added
   - Recommendation: Add database trigger

2. **No Review Deletion**
   - Reviews are permanent records
   - Can't be edited by customers
   - Only replies can be updated

3. **No Moderation**
   - Reviews post immediately
   - No spam detection
   - No inappropriate content filtering

4. **No Images**
   - Text-only reviews
   - No photo uploads

5. **Limited Sorting**
   - Reviews displayed chronologically only
   - No filter/sort options

---

## 📋 Files Checklist

**Essential Files:**
- ✅ `client/components/orders/order-rating.tsx` - Review submission
- ✅ `admin/app/(app)/reviews/reviews-client.tsx` - Admin interface
- ✅ `client/scripts/consolidated_setup.sql` - Database schema
- ✅ `admin/scripts/fix_reviews_rls.sql` - Security policies
- ✅ `client/lib/i18n/translations.ts` - Multi-language support

**Display Files:**
- ✅ `client/app/restaurant/[id]/page.tsx` - Show rating
- ✅ `client/app/orders/[id]/page.tsx` - Rating component location

**Data Files:**
- ✅ `admin/lib/db.ts` - Review type definition
- ✅ `client/lib/cafe-db.ts` - Restaurant type with rating

---

## 🔗 Related Documentation

- **Database:** See `consolidated_setup.sql` for full schema
- **Types:** Check `lib/db.ts` for full interface definitions
- **API:** Check `app/api/` directories for endpoints
- **UI:** Check `components/ui/` for component details
- **i18n:** Check `lib/i18n/` for all translations
