import type { TimelineEvent, Character, Civilization, MapData, MusicParameters, SceneHotspot, VoiceDescription } from '../types.ts';

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    timestamp: number;
    data: T;
}

/**
 * Generates a consistent, unique key from a set of parameters.
 * @param parts An array of strings, booleans, or numbers that define a unique request.
 * @returns A single string key.
 */
const generateKey = (parts: (string | boolean | number | null | undefined)[]): string => {
    return parts.map(p => String(p ?? 'null')).join(':');
};

/**
 * Retrieves an item from the session cache if it exists and has not expired.
 * @param key The cache key.
 * @returns The cached data or null if not found or expired.
 */
const get = <T>(key: string): T | null => {
    try {
        const itemStr = sessionStorage.getItem(key);
        if (!itemStr) {
            return null;
        }

        const item: CacheEntry<T> = JSON.parse(itemStr);
        const now = Date.now();

        if (now - item.timestamp > CACHE_EXPIRY_MS) {
            sessionStorage.removeItem(key);
            return null;
        }

        return item.data;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
};

/**
 * Stores an item in the session cache with the current timestamp.
 * @param key The cache key.
 * @param data The data to store.
 */
const set = <T>(key: string, data: T): void => {
    try {
        const item: CacheEntry<T> = {
            timestamp: Date.now(),
            data,
        };
        sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error('Cache set error:', error);
        // This can happen if sessionStorage is full.
    }
};

export const cacheService = {
    generateKey,
    get,
    set,
};

// A higher-order function to wrap API calls with caching logic
export async function withCache<T>(
    keyParts: (string | boolean | number | null | undefined)[],
    apiCall: () => Promise<T>
): Promise<T> {
    const key = generateKey(keyParts);
    const cachedData = get<T>(key);

    if (cachedData !== null) {
        console.log(`[Cache] HIT for key: ${key}`);
        return cachedData;
    }

    console.log(`[Cache] MISS for key: ${key}`);
    const result = await apiCall();
    set(key, result);
    return result;
}
