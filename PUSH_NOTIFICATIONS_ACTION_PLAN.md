# 🚀 Push Notifications Domain Fix - Action Plan

## Problems Found

**Why push notifications don't work on your domain:**

1. **❌ HTTP instead of HTTPS** ← **MAIN ISSUE!**
   - VPS URL: `http://78.140.223.129:8090`
   - Push notifications require HTTPS
   - Service Workers won't work on HTTP

2. **❌ Client app missing environment config**
   - ✅ FIXED: Created `/client/.env.local`

3. **❌ Firebase domain not registered**
   - Domain not allowed in Firebase Console

4. **❌ Service Worker might not be accessible**
   - `/firebase-messaging-sw.js` must be available on domain

---

## Action Plan (Priority Order)

### 🟥 CRITICAL - Step 1: Enable HTTPS on Domain

**Why:** Push notifications absolutely require HTTPS. They will NOT work on HTTP.

**Option A - Use Cloudflare (Easiest, Free)**
```
1. Go to cloudflare.com
2. Sign up and add your domain
3. Point DNS to Cloudflare nameservers
4. Wait 24 hours for DNS to propagate
5. Enable SSL/TLS → Full
6. Now you have: https://yourdomain.com ✅
```

**Option B - Use Let's Encrypt + Nginx**
```bash
# On your server:
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate:
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Configure nginx for HTTPS (ask DevOps team for help)
```

**Option C - Use AWS/Vercel Certificate**
```bash
# If using Vercel:
# - Connect domain to Vercel
# - Automatic SSL on all domains

# If using AWS:
# - Request certificate in AWS Certificate Manager
# - It's free and automatic
```

### 🟨 HIGH - Step 2: Update Environment URLs

**In both files, CHANGE this:**
```bash
# ❌ OLD (HTTP - doesn't work)
NEXT_PUBLIC_VPS_URL="http://78.140.223.129:8090"

# ✅ NEW (HTTPS - works!)
NEXT_PUBLIC_VPS_URL="https://yourdomain.com"
```

**Files to update:**
- [ ] `/admin/.env.local`
- [ ] `/client/.env.local` ✅ Already created

**Command to update:**
```bash
# In /admin/.env.local
sed -i 's|http://78.140.223.129:8090|https://yourdomain.com|g' .env.local

# In /client/.env.local  
sed -i 's|http://78.140.223.129:8090|https://yourdomain.com|g' .env.local
```

### 🟩 MEDIUM - Step 3: Register Domain in Firebase Console

1. Go to: https://console.firebase.google.com
2. Select project: **mazirapp**
3. Go to: **Settings** → **Authentication** → **Authorized Domains**
4. Click **Add Domain**
5. Enter your domain: `yourdomain.com`
6. Click **Save**

**What to add:**
- `yourdomain.com`
- `www.yourdomain.com`
- `admin.yourdomain.com` (if using subdomain)

### 🟩 MEDIUM - Step 4: Verify Service Workers

**Test in browser console (F12) on your domain:**
```javascript
// Check if service worker registered:
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('✅ SWs registered:', regs.length))
  .catch(e => console.error('❌ Error:', e))

// Check if firebase-messaging-sw.js loads:
fetch('/firebase-messaging-sw.js')
  .then(r => console.log('✅ SW file:', r.status))
  .catch(e => console.error('❌ SW file error:', e))
```

### 🟦 LOW - Step 5: Verify Notification Storage in Database

**Run this SQL on Supabase:**
```sql
-- Check if users have push subscriptions saved:
SELECT id, full_name, fcm_token, push_subscription 
FROM staff_profiles 
WHERE cafe_id = 'YOUR_CAFE_ID' 
LIMIT 5;

-- Should show subscriber data ✅
```

---

## Testing Steps

### Test 1: Verify HTTPS Works
```bash
# In terminal:
curl -I https://yourdomain.com
# Should return: HTTP/1.1 200 OK ✅
```

### Test 2: Enable Notifications in Admin
1. Go to: `https://yourdomain.com/admin`
2. Login
3. Go to: **Settings** → **Profile** → **Notifications**
4. Click **Enable (Қосу)**
5. Click **Allow** when browser asks for permission
6. Should see: ✅ **"Уведомления успешно включены"**

### Test 3: Send Test Notification
1. Same page: **Settings** → **Profile**
2. Click **Check Push** button
3. Should see test notification appear
4. Check browser console for:
   ```
   [Push] Delivered successfully via X/X channels ✅
   ```

### Test 4: Monitor Logs
```bash
# Watch server logs for push delivery:
docker logs your-app-container | grep -i push

# Should see:
[Push] Attempting FCM delivery...
[Push] Attempting Web-Push delivery...
[Push] Delivered successfully via 2/2 channels ✅
```

---

## Troubleshooting

### ❌ Still not working after HTTPS?

**Check 1: Is HTTPS actually active?**
```bash
# Visit in browser
https://yourdomain.com  # Should NOT show SSL error

# In browser F12 console:
console.log(window.location.protocol)  # Should be: https:
```

**Check 2: Service Worker blocked?**
```javascript
// In browser console:
navigator.serviceWorker.ready
  .then(() => console.log('✅ Service worker ready'))
  .catch(e => console.error('❌ Error:', e.message))
```

**Check 3: Firebase domain not registered?**
- Go back to Firebase Console
- Check "Authorized Domains" section
- Make sure your domain is there

**Check 4: Env variables loaded?**
```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_VPS_URL)
// Should show: https://yourdomain.com ✅
```

**Check 5: Logs show errors?**
```bash
# On server:
docker logs app-container | grep "ERROR\|WARN" | tail -20
```

---

## Files Changed

✅ **Created:**
- `/client/.env.local` - Client app environment configuration
- `/PUSH_NOTIFICATIONS_DOMAIN_ISSUES.md` - Full diagnosis document

✅ **To Update:**
- `/admin/.env.local` - Change VPS URL to HTTPS
- `/client/.env.local` - Change VPS URL to HTTPS (when domain ready)

---

## Quick Reference

| Item | Status | Fix |
|------|--------|-----|
| HTTPS setup | ❌ Pending | Set up SSL certificate |
| VPS URL | ❌ HTTP | Change to HTTPS domain |
| Client .env | ✅ Done | `/client/.env.local` created |
| Firebase domain | ❌ Pending | Add domain to Firebase Console |
| Service Workers | ✅ Ready | Already in place |

---

## Timeline

- **Immediate (Today):** Set up HTTPS
- **Same Day:** Update env files
- **Next 24h:** Firebase configuration
- **Day 3:** Full testing

---

## Contact/Support

If stuck:
1. Check `/PUSH_NOTIFICATIONS_DOMAIN_ISSUES.md` for detailed troubleshooting
2. Check `/PUSH_NOTIFICATIONS_SETUP.md` for original setup guide
3. Check browser console (F12) for errors
4. Check server logs: `docker logs app-container | grep Push`

---

**Status: READY TO FIX** ✅

All diagnosis complete. You now have all the information needed to enable push notifications on your domain. The main blocker is HTTPS. Once you set that up, everything else will fall into place.
