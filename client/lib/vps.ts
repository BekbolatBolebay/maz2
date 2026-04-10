import PocketBase from 'pocketbase';

const VPS_URL = process.env.NEXT_PUBLIC_VPS_URL || 'http://78.140.223.129:8090';
const pb = new PocketBase(VPS_URL);

// Disable auto cancellation and force no-store to prevent aggressive Next.js caching
pb.autoCancellation(false);
pb.beforeSend = function (url, options) {
    options.cache = 'no-store';
    return { url, options };
};

/**
 * Secures requests by authenticating as PocketBase Admin (Server-side only).
 */
export async function authenticateVPS() {
    if (typeof window !== 'undefined') return pb; // Client ignores
    
    if (pb.authStore.isValid && pb.authStore.isAdmin) return pb;
    
    const email = process.env.VPS_ADMIN_EMAIL;
    const password = process.env.VPS_ADMIN_PASSWORD;

    if (!email || !password) {
        if (typeof window === 'undefined') {
            console.warn('[VPS] Warning: VPS_ADMIN_EMAIL or VPS_ADMIN_PASSWORD is missing.');
        }
        return pb;
    }

    try {
        // MANUAL OVERRIDE for PB v0.22.7 compatibility
        const authUrl = `${VPS_URL}/api/admins/auth-with-password`;
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password }),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Auth failed with status ${response.status}`);
        }

        const data = await response.json();
        pb.authStore.save(data.token, data.admin);
        
        if (typeof window === 'undefined') {
            console.log('[VPS] Successfully authenticated using legacy /api/admins path');
        }
    } catch (err: any) {
        if (typeof window === 'undefined') {
            console.error('[VPS] Authentication failed:', err.message);
        }
    }
    return pb;
}

/**
 * Saves personal identifiable information (PII) to the VPS.
 */
export async function savePII(collection: string, data: Record<string, any>) {
    try {
        const adminPb = await authenticateVPS();
        const record = await adminPb.collection(collection).create(data);
        return record.id;
    } catch (error: any) {
        if (error.status === 404) {
            const msg = `[VPS] Collection "${collection}" not found. Please import pocketbase_schema.json in your VPS Admin Dashboard (Settings -> Import).`;
            throw new Error(msg);
        }
        console.error(`[VPS] Error saving PII to ${collection}:`, error.message || error);
        throw error;
    }
}

/**
 * Retrieves PII from the VPS by its ID.
 */
export async function getPII(collection: string, id: string) {
    if (!id || id.length < 5) return null;
    try {
        return await pb.collection(collection).getOne(id);
    } catch (error) {
        return null;
    }
}

/**
 * Updates existing PII in the VPS.
 */
export async function updatePII(collection: string, id: string, data: Record<string, any>) {
    try {
        const adminPb = await authenticateVPS();
        return await adminPb.collection(collection).update(id, data);
    } catch (error: any) {
        console.error(`[VPS] Error updating PII in ${collection}:`, error.message || error);
        throw error;
    }
}

/**
 * Bulk retrieves PII for a list of IDs.
 */
export async function getBulkPII(collection: string, ids: string[]) {
    if (!ids.length) return [];
    try {
        const filter = ids.map(id => `id="${id}"`).join(' || ');
        return await pb.collection(collection).getFullList({ filter });
    } catch (error) {
        return [];
    }
}

/**
 * MERCHANT CONFIGS & OPERATIONAL STATE
 */

export async function getMerchantConfig(restaurantId: string) {
    // Priority 1: Try to get from VPS with admin auth
    try {
        const adminPb = await authenticateVPS();
        if (adminPb.authStore.isValid && adminPb.authStore.isAdmin) {
             const record = await adminPb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
             if (record && record.config) {
                 return { ...record.config, id: record.id };
             }
        }
    } catch (error) {
        console.warn(`[VPS] Admin-authenticated fetch failed for ${restaurantId}, trying fallbacks...`);
    }

    // Priority 2: Try to get from VPS using public read (if configured)
    try {
        const record = await pb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
        if (record && record.config) {
            return { ...record.config, id: record.id };
        }
    } catch (error) {
        // Public read failed
    }

    // Priority 3: SELF-HEALING Fallback to Vercel Environment Variables
    const envMerchantId = process.env.FREEDOM_MERCHANT_ID || process.env.NEXT_PUBLIC_FREEDOM_MERCHANT_ID;
    const envSecretKey = process.env.FREEDOM_SECRET_KEY || process.env.FREEDOM_PAYMENT_SECRET_KEY || process.env.FREEDOM_SECRET_KEY;

    if (envMerchantId && envSecretKey) {
        console.log(`[VPS] Using FREEDOM_* environment variables as fallback source for ${restaurantId}`);
        
        return {
            restaurant_id: restaurantId,
            freedom_merchant_id: envMerchantId,
            freedom_payment_secret_key: envSecretKey,
            status: 'active',
            is_auto_provisioned: true
        };
    }

    return null;
}

export async function saveMerchantConfig(restaurantId: string, data: Record<string, any>) {
    try {
        const adminPb = await authenticateVPS();
        
        // Try to find if it already exists in the DB first (using admin rights if we have them)
        let existingId: string | null = null;
        try {
            const existing = await adminPb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
            if (existing) existingId = existing.id;
        } catch (e) {
            // Not found or no permission
        }

        if (existingId) {
            console.log(`[VPS] Updating existing merchant config: ${existingId}`);
            return await adminPb.collection('merchant_configs').update(existingId, { config: data });
        } else {
            console.log(`[VPS] Creating new merchant config for restaurant: ${restaurantId}`);
            try {
                return await adminPb.collection('merchant_configs').create({ config: data, restaurant_id: restaurantId });
            } catch (createErr: any) {
                // If create fails with 400 (likely unique constraint), try to update
                if (createErr.status === 400) {
                   const secondTry = await adminPb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
                   return await adminPb.collection('merchant_configs').update(secondTry.id, { config: data });
                }
                throw createErr;
            }
        }
    } catch (error) {
        console.error(`[VPS] Error saving merchant config:`, error);
        throw error;
    }
}

export async function getRestaurantStatus(restaurantId: string) {
    try {
        const adminPb = await authenticateVPS();
        return await adminPb.collection('restaurants').getFirstListItem(`restaurant_id="${restaurantId}"`);
    } catch (error) {
        return null; // Default to closed or fallback to Supabase if not on VPS
    }
}

export async function updateRestaurantStatus(restaurantId: string, status: string) {
    try {
        const existing = await getRestaurantStatus(restaurantId);
        if (existing) {
            return await pb.collection('restaurants').update(existing.id, { status });
        } else {
            return await pb.collection('restaurants').create({ restaurant_id: restaurantId, status });
        }
    } catch (error) {
        console.error(`[VPS] Error updating status:`, error);
        throw error;
    }
}

/**
 * REAL-TIME SUBSCRIPTION
 */
export function subscribeToVPS(collection: string, callback: (data: any) => void, id?: string) {
    const topic = id ? id : '*';
    pb.collection(collection).subscribe(topic, (e) => {
        callback(e);
    });

    // Return unsubscribe function
    return () => pb.collection(collection).unsubscribe(topic);
}

export default pb;
