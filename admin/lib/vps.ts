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
            console.warn('[VPS] Warning: VPS_ADMIN_EMAIL or VPS_ADMIN_PASSWORD is missing. Operating in reduced functionality mode (Read-only for public collections).');
        }
        return pb; // Return unauthenticated pb client
    }

    try {
        await pb.admins.authWithPassword(email, password);
    } catch (err: any) {
        if (typeof window === 'undefined') {
            console.error('[VPS] Authentication failed. Using unauthenticated client.', err.message);
        }
        // Don't throw, let the caller handle unauthorized errors from specific collections
    }
    return pb;
}

/**
 * Retrieves PII from the VPS by its ID.
 */
export async function getPII(collection: string, id: string) {
    if (!id || id.length < 5) return null;
    try {
        const adminPb = await authenticateVPS();
        return await adminPb.collection(collection).getOne(id);

    } catch (error) {
        return null;
    }
}

/**
 * Creates or updates PII in the VPS.
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

export async function updatePII(collection: string, id: string, data: Record<string, any>) {
    try {
        const adminPb = await authenticateVPS();
        return await adminPb.collection(collection).update(id, data);
    } catch (error: any) {
        console.error(`[VPS] Error updating PII in ${collection}:`, error);
        throw error;
    }
}

/**
 * Bulk retrieves PII for a list of IDs.
 */
export async function getBulkPII(collection: string, ids: string[]) {
    if (!ids.length) return [];
    const validIds = ids.filter(id => id && id.length >= 10);
    if (!validIds.length) return [];

    try {
        const filter = validIds.map(id => `id="${id}"`).join(' || ');
        const adminPb = await authenticateVPS();
        return await adminPb.collection(collection).getFullList({ filter });
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
             if (record) return record;
        }
    } catch (error) {
        console.warn(`[VPS] Admin-authenticated fetch failed for ${restaurantId}, trying fallbacks...`);
    }

    // Priority 2: Try to get from VPS using public read (if configured)
    try {
        const record = await pb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
        if (record) return record;
    } catch (error) {
        // Public read failed
    }

    // Priority 3: SELF-HEALING Fallback to Vercel Environment Variables
    const envMerchantId = process.env.FREEDOM_MERCHANT_ID || process.env.NEXT_PUBLIC_FREEDOM_MERCHANT_ID;
    const envSecretKey = process.env.FREEDOM_SECRET_KEY || process.env.FREEDOM_PAYMENT_SECRET_KEY || process.env.FREEDOM_SECRET_KEY;

    if (envMerchantId && envSecretKey) {
        console.log(`[VPS] Using FREEDOM_* environment variables as fallback source for ${restaurantId}`);
        
        const fallbackData = {
            restaurant_id: restaurantId,
            freedom_merchant_id: envMerchantId,
            freedom_payment_secret_key: envSecretKey,
            status: 'active',
            is_auto_provisioned: true
        };

        // Attempt to auto-sync to VPS if we have admin rights after all
        try {
            const adminPb = await authenticateVPS();
            if (adminPb.authStore.isValid && adminPb.authStore.isAdmin) {
                await adminPb.collection('merchant_configs').create(fallbackData);
                console.log(`[VPS] Successfully auto-provisioned merchant config for ${restaurantId}`);
            }
        } catch (saveErr) {
            // Ignore save error, we already have the fallback data
        }

        return fallbackData;
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
            return await adminPb.collection('merchant_configs').update(existingId, data);
        } else {
            console.log(`[VPS] Creating new merchant config for restaurant: ${restaurantId}`);
            try {
                return await adminPb.collection('merchant_configs').create({ ...data, restaurant_id: restaurantId });
            } catch (createErr: any) {
                // If create fails with 400, it might be a race condition where it was just created
                if (createErr.status === 400) {
                   const secondTry = await adminPb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
                   return await adminPb.collection('merchant_configs').update(secondTry.id, data);
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
        return null; 
    }
}

export async function updateRestaurantStatus(restaurantId: string, status: string) {
    try {
        const existing = await getRestaurantStatus(restaurantId);
        const adminPb = await authenticateVPS();
        if (existing) {
            return await adminPb.collection('restaurants').update(existing.id, { status });
        } else {
            return await adminPb.collection('restaurants').create({ restaurant_id: restaurantId, status });
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

    return () => pb.collection(collection).unsubscribe(topic);
}

export default pb;
