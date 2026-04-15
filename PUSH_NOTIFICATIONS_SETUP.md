# 🚀 Push Notifications - Complete Setup & Testing Guide

## Overview
Your project uses a **multi-channel push notification system**:
- ✅ **Firebase Cloud Messaging (FCM)** - Background & foreground messages
- ✅ **Web Push API** - VAPID-based subscriptions
- ✅ **Email Notifications** - SMTP backup channel

## ✅ What Has Been Fixed

### 1. **Admin Environment Configuration** (`admin/.env.local`)
   - Added Firebase Web configuration
   - Added Firebase Admin backend credentials
   - Added VAPID public/private keys
   - Added Supabase backend keys
   - Added SMTP configuration

### 2. **sendTestPushAction Enhancement**
   - Now fetches `fcm_token`, `push_subscription`, and `push_token`
   - Handles both Firebase and Web-Push channels
   - Proper fallback if push_token is stringified

### 3. **VAPID Configuration Improvements**
   - Added proper VAPID subject validation
   - Better error messaging if keys are missing
   - Proper initialization logging

### 4. **Error Handling in Notifications**
   - Uses `Promise.allSettled()` instead of `Promise.all()` for graceful degradation
   - Tracks which channels succeeded/failed
   - Better error messages with status codes

## 📋 Prerequisites Checklist

Before testing, ensure these are in place:

### Database Schema
- [ ] Run this SQL on your Supabase database:
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS push_token TEXT;
```

### Environment Variables
- [ ] Verify `/admin/.env.local` has all required variables:
  - `NEXT_PUBLIC_FIREBASE_*` (all Firebase Web keys)
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
  - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### Browser Requirements
- [ ] Modern browser with Service Worker support (Chrome, Edge, Firefox, Safari 16+)
- [ ] HTTPS connection (required for service workers and push notifications)
- [ ] Notifications permission supported

## 🧪 Step-by-Step Testing

### Step 1: Enable Push Notifications (Admin Panel)
1. Log in to the admin panel
2. Go to **Settings/Profile** page
3. Look for **"Notifications"** section
4. Click the **"Enable" (Қосу)** button
5. **Allow** notification permission when prompted
6. Watch the browser console:
   ```
   [AdminPush] Notification permission granted
   [AdminPush] Native subscription obtained
   [AdminPush] FCM Token obtained: Success
   [AdminPush] Saving subscription for admin: [user-id]
   ```
7. You should see a success toast: **"Уведомления успешно включены"**

### Step 2: Send Test Email
1. In the same Settings/Profile page
2. Click **"Check Email"** button
3. Check your email inbox
4. Verify you receive the test email from Mazir App

### Step 3: Send Test Push Notification
1. In the same Settings/Profile page
2. Click **"Check Push"** button
3. Watch the console for:
   ```
   [Push] Attempting FCM delivery for token: ...
   [Push] Attempting Web-Push delivery for endpoint: ...
   [Push] Delivered successfully via X/X channels
   ```
4. You should see a test notification appear:
   - **Title:** "Тест хабарламасы"
   - **Body:** "Push-хабарламалар сәтті қосылды! ✅"

### Step 4: Test Foreground Messages
1. Keep the admin panel open
2. Trigger a test notification from the backend
3. You should see an in-app toast notification appear

### Step 5: Test Background Messages
1. Close the admin panel (or minimize the window)
2. Trigger a test notification from the backend
3. You should see a system notification appear

## 🔍 Troubleshooting

### Issue: "Browser не поддерживает уведомления"
**Solution:** 
- Check browser compatibility (must be Chrome, Edge, Firefox, or Safari 16+)
- Ensure you're on HTTPS (if localhost works in insecure context)
- Check if Service Workers are supported

### Issue: "Service Worker registration failed"
**Solution:**
- Verify service workers are enabled in browser settings
- Check browser console for specific errors
- Check that `/public/sw.js` and `/public/firebase-messaging-sw.js` exist
- Clear browser cache and reload

### Issue: "Push-хабарламаларға рұқсат берілмеген" (during test)
**Solution:**
- First, click **"Enable"** button to ensure subscription is saved
- Check database with:
```sql
SELECT id, push_subscription, fcm_token FROM staff_profiles WHERE id = '[your-user-id]';
```
- Ensure both fields are NOT NULL

### Issue: FCM Token shows "Failed" in console
**Solution:**
- Verify Firebase credentials in `admin/.env.local`
- Check that `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set
- Verify Firebase project is properly configured in Google Cloud Console
- Check Firebase messaging is enabled in your Firebase project

### Issue: Web-Push not working but FCM works
**Solution:**
- Verify `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set
- The VAPID keys must be in correct format (base64 URL-safe)
- Check server logs for web-push specific errors (410 = subscription expired)

### Issue: Server says "No subscription or token found"
**Solution:**
- Run the SQL to add columns if not present:
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name='staff_profiles' 
AND column_name IN ('push_subscription', 'fcm_token', 'push_token');
```
- If missing, run the fix SQL script from the scripts folder
- User must click "Enable" before testing

## 📊 Testing Different Scenarios

### Send Notification to Specific Staff Member
```typescript
// In your backend code
import { notifyCustomer } from '@/lib/notifications';

await notifyCustomer(staffMemberId, {
  title: 'Test',
  body: 'Test message',
  icon: '/icon.png',
  url: '/orders'
});
```

### Send Notification to All Staff in Restaurant
```typescript
import { notifyAdminAllChannels } from '@/lib/notifications';

await notifyAdminAllChannels(orderData, restaurantData);
```

### Debug: Check Stored Subscriptions
```sql
SELECT id, full_name, fcm_token, push_subscription IS NOT NULL as has_push 
FROM staff_profiles 
WHERE cafe_id = '[restaurant-id]';
```

## 🛠️ Advanced Configuration

### Change VAPID Keys (Generate New Ones)
```bash
# Generate new VAPID keys (requires web-push npm package)
npx web-push generate-vapid-keys

# Update .env files with new keys
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
# VAPID_PRIVATE_KEY=<private key>
```

### Update Firebase Admin Credentials
1. Go to Google Cloud Console → Your Project
2. Service Accounts → Firebase Admin SDK
3. Generate new private key (JSON)
4. Extract and update in `.env.local`:
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_PROJECT_ID`

### Monitor Push Delivery
Check these logs in server console:
```
[Push] Attempting FCM delivery...
[Push] Attempting Web-Push delivery...
[Push] Delivered successfully via 2/2 channels
```

## 📱 Mobile & Progressive Web App

### For iOS (PWA)
1. Go to Settings → Apps → Browser
2. Add to Home Screen
3. Follow install prompt
4. Open from home screen
5. Enable notifications
6. Push notifications will work even when app is closed

### For Android
1. Browser → Share → Add to Home Screen
2. Or: Menu → Install App
3. Enable notifications when prompted
4. Notifications work in background

## 🚨 Emergency Checklist

If push notifications still don't work:

- [ ] Check admin `.env.local` has all FIREBASE_ and VAPID keys
- [ ] Verify database columns exist (run schema SQL)
- [ ] Clear browser cache and service workers
- [ ] Rebuild the app: `cd admin && npm run build`
- [ ] Check browser console for specific errors
- [ ] Run test email first (easier to debug)
- [ ] Verify SMTP credentials are working
- [ ] Check Firebase project is active in Google Cloud
- [ ] Ensure notifications permission is "granted" (not "denied")

## 📖 Reference Files

Key files for push notifications:
- `/admin/.env.local` - Configuration
- `/admin/lib/firebase.ts` - FCM setup (client)
- `/admin/lib/firebase-admin.ts` - FCM setup (server)
- `/admin/lib/notifications.ts` - Notification sending logic
- `/admin/lib/actions.ts` - Server actions (sendTestPushAction)
- `/admin/components/fcm-handler.tsx` - Foreground message listener
- `/admin/app/(app)/profile/profile-client.tsx` - UI for enabling notifications
- `/admin/public/firebase-messaging-sw.js` - Background message handler
- `/admin/public/sw.js` - Service worker

## ✨ Next Steps

1. **Test in Development:** Follow the step-by-step testing guide above
2. **Production Deployment:**
   - Update `.env.local` in production environment
   - Ensure HTTPS is enabled
   - Verify all Firebase credentials are correct
   - Test a few real notifications

3. **Monitor & Maintain:**
   - Check logs for failed deliveries
   - Monitor Firebase usage in Google Cloud Console
   - Update VAPID keys if needed
   - Keep Firebase SDK updated

---

**Created:** 2026-04-15  
**Status:** ✅ Configuration Complete  
**Support:** Check console logs for detailed error messages
