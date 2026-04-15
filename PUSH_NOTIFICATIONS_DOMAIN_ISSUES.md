# 🚨 Push Notifications Domain Issues - Diagnosis & Fixes

## Critical Issues Found

### 1. **HTTPS Requirement (BLOCKING ISSUE ⛔)**

**Problem:**
```
NEXT_PUBLIC_VPS_URL="http://78.140.223.129:8090"  ❌ HTTP
```

**Why it fails:**
- Push Notifications API requires **HTTPS only**
- Service Workers only work on HTTPS (except localhost)
- Firebase Cloud Messaging requires HTTPS
- Web Push API requires HTTPS

**Solution:**
```bash
# 1. Get SSL certificate
# Option A: Use Cloudflare (fastest)
#  - Point DNS to Cloudflare
#  - Enable SSL/TLS (Auto)
#  - Result: https://yourdomain.com ✅

# Option B: Use Let's Encrypt
# certbot certonly --standalone -d yourdomain.com
# Then configure nginx/apache for SSL

# 2. Update .env files
NEXT_PUBLIC_VPS_URL="https://yourdomain.com"  ✅
```

### 2. **Client App Missing Environment Configuration**

**Problem:**
- `/client/.env.local` doesn't exist
- Firebase Web config not set up for client app
- VAPID keys not configured

**Files needed:**
```bash
/client/.env.local  ← MISSING!
```

**Solution - Create `/client/.env.local`:**
```env
# Copy these from /admin/.env.local:
NEXT_PUBLIC_SUPABASE_URL="https://wuhefcbofaoqvsrejcjc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_NepBAA9CP5YzM9EzLdJZKg_h8BGOCtQ"

# Firebase Web Configuration (MUST MATCH ADMIN)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDHrnmjl7MJC0dz-SDHXDAgFoD2Dl8p60k
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mazirapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mazirapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mazirapp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1018433182095
NEXT_PUBLIC_FIREBASE_APP_ID=1:1018433182095:web:6aa27626b3ec44bf1953fa
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BChky5iy7d4GB3Ic35F4rM8BnxgOWRRxPnieNn2IynuXyDZoe41nl7i1vMORpU2mgHwRXc3cdLIFqAxgXV1nAbs

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOidI-292HTltxDIdZxYBEnzGonPFNwn5Nz0lJWnhoukw6pDQ8wcPWCswoVV0ufzpdXC0Z1cZLN6rlCnyER6seQ
VAPID_PRIVATE_KEY=VjCqhv4S_MXVf3KocqG4zIOEDywDu-ANQiMi7Swfd-Q
VAPID_SUBJECT="mailto:bolebay.bekbolat.25@gmail.com"

# VPS URL (MUST BE HTTPS!)
NEXT_PUBLIC_VPS_URL="https://yourdomain.com"  # ← Change this!

# Supabase Backend Keys
SUPABASE_URL="https://wuhefcbofaoqvsrejcjc.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_JWT_SECRET="Spjpp945rR4jy1nHv7ZWcE5FCV5w1b0sS4utwQunV9fGpZy5gXTkYJz3APEAltiqx45UmBisFQqnqf3qPFKJZg=="

# Firebase Admin Backend Configuration
FIREBASE_PROJECT_ID=mazirapp
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mazirapp.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDBWXqbG6cf..."
```

### 3. **Service Worker Registration Issues**

**Current Setup:**
- ✅ Service workers exist: `/admin/public/firebase-messaging-sw.js`, `/client/public/firebase-messaging-sw.js`
- ✅ FCMHandler component in place
- ⚠️ May not be registered on production domain

**Check in Browser Console (F12):**
```javascript
navigator.serviceWorker.ready
  .then(reg => console.log('✅ SW registered:', reg))
  .catch(err => console.error('❌ SW error:', err))
```

**If fails on domain, check:**
1. Is page served over HTTPS? 
2. Is `/firebase-messaging-sw.js` accessible?
3. Any browser console errors?

**Fix if needed - Update `/admin/next.config.mjs`:**
```javascript
// Make sure PWA is disabled in production 
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',  // ✅ This is good
  register: true,  // Make sure this isn't false on production
  cacheOnFrontEndNav: true,
});
```

### 4. **Firebase Console Configuration**

**Problem:**
- Firebase project might not have domain registered
- CORS restrictions could block requests

**Check in Firebase Console:**
1. Go to: https://console.firebase.google.com
2. Select project: `mazirapp`
3. → Settings → Authorized Domains
4. Check if your domain is listed

**Fix - Add Domain to Firebase:**
```
Firebase Console → Auth Settings → Authorized Domains → Add Domain
- yourdomain.com ✅
- www.yourdomain.com ✅
- localhost ✅ (for testing)
```

### 5. **Cross-Origin Resource Sharing (CORS)**

**If notifications fail to deliver:**
```
Check server logs for CORS errors:
GET https://fcm.googleapis.com/... -> CORS Error
```

**Solution - Configure backend headers:**
```typescript
// In /admin/lib/firebase-admin.ts - already correct ✅
// In /admin/middleware.ts - add CORS:

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Checklist - Fix These First

- [ ] **1. Set up HTTPS on domain**
  ```bash
  # Test: curl -I https://yourdomain.com should return 200
  curl -I https://yourdomain.com
  ```

- [ ] **2. Create `/client/.env.local`** with all environment variables
  ```bash
  cp admin/.env.local client/.env.local  # Start from admin
  # Then edit NEXT_PUBLIC_VPS_URL to https://yourdomain.com
  ```

- [ ] **3. Update `NEXT_PUBLIC_VPS_URL` in BOTH files**
  ```bash
  # .env.local files
  NEXT_PUBLIC_VPS_URL="https://yourdomain.com"  ← Must be HTTPS!
  ```

- [ ] **4. Add domain to Firebase Console**
  - Go to: https://console.firebase.google.com
  - Project: mazirapp
  - Settings → Auth → Authorized Domains → Add domain

- [ ] **5. Verify Service Worker on domain**
  ```bash
  # In browser console on your domain (F12):
  navigator.serviceWorker.ready.then(reg => console.log('✅ SW:', reg))
  ```

- [ ] **6. Test Push Notifications**
  ```bash
  # In admin panel: Settings → Notifications → "Check Push" button
  # Should see notification appear
  ```

---

## Testing Command

After fixes, test notifications with:

```javascript
// In browser console on https://yourdomain.com
const result = await fetch('/api/test-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'YOUR_USER_ID' })
});
console.log('Push test:', await result.json());
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `NotAllowedError: Notifications are not supported` | HTTP protocol | Switch to HTTPS |
| `Service Worker not found` | Missing SW file | Ensure `/firebase-messaging-sw.js` exists |
| `VAPID key mismatch` | Wrong key in env | Copy keys from Firebase console |
| `Installation id not found` | Domain changed | Clear browser cache, re-enable notifications |
| `401 Unauthorized FCM` | Wrong Firebase creds | Verify Firebase admin keys in .env |

---

**Next Steps:**
1. ✅ Set up HTTPS certificate on your domain
2. ✅ Create `/client/.env.local`
3. ✅ Update `NEXT_PUBLIC_VPS_URL` to `https://yourdomain.com`
4. ✅ Add domain to Firebase Console
5. ✅ Test push notifications in admin panel

**Questions? Check logs:**
```bash
# Admin panel (F12 → Console):
# Look for: [Push] ✅ or [Push] ❌ messages

# Server logs:
# docker logs your-container | grep Push
```
