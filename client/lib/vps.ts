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
    if (email && password) {
        try {
            await pb.admins.authWithPassword(email, password);
        } catch (err) {
            console.error('[VPS] Admin authentication failed', err);
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
    try {
        const adminPb = await authenticateVPS();
        return await adminPb.collection('merchant_configs').getFirstListItem(`restaurant_id="${restaurantId}"`);
    } catch (error) {
        return null;
    }
}

export async function saveMerchantConfig(restaurantId: string, data: Record<string, any>) {
    try {
        const existing = await getMerchantConfig(restaurantId);
        if (existing) {
            return await pb.collection('merchant_configs').update(existing.id, data);
        } else {
            return await pb.collection('merchant_configs').create({ ...data, restaurant_id: restaurantId });
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
