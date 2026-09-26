import { storage } from '#imports';
import type { ServiceDetails } from './api';
import type { SupportedLanguage } from './language';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const DETAILS_FRESH_FOR = 30 * MINUTE;
const DETAILS_MAX_AGE = 7 * DAY;
const DETAILS_MAX_ENTRIES = 20;

const SEARCH_MAX_AGE = DAY;
const SEARCH_MAX_ENTRIES = 200;

interface CacheEntry<T> {
    value: T;
    fetchedAt: number;
}

type Cache<T> = Record<string, CacheEntry<T>>;

const detailsCacheItem = storage.defineItem<Cache<ServiceDetails>>('local:serviceDetailsCache', {
    fallback: {},
});

const searchCacheItem = storage.defineItem<Cache<string | null>>('local:serviceSearchCache', {
    fallback: {},
});

export interface CachedDetails {
    details: ServiceDetails;
    stale: boolean;
}

function detailsKey(serviceId: string, language: SupportedLanguage): string {
    return `${serviceId}:${language}`;
}

export async function getCachedDetails(
    serviceId: string,
    language: SupportedLanguage
): Promise<CachedDetails | null> {
    const entry = (await detailsCacheItem.getValue())[detailsKey(serviceId, language)];
    if (!entry) {
        return null;
    }
    const age = Date.now() - entry.fetchedAt;
    if (age > DETAILS_MAX_AGE || age < 0) {
        return null;
    }
    return { details: entry.value, stale: age > DETAILS_FRESH_FOR };
}

export async function setCachedDetails(
    serviceId: string,
    language: SupportedLanguage,
    details: ServiceDetails
): Promise<void> {
    const cache = await detailsCacheItem.getValue();
    cache[detailsKey(serviceId, language)] = { value: details, fetchedAt: Date.now() };
    await detailsCacheItem.setValue(prune(cache, DETAILS_MAX_AGE, DETAILS_MAX_ENTRIES));
}

export async function getCachedSearch(domain: string): Promise<string | null | undefined> {
    const entry = (await searchCacheItem.getValue())[domain];
    if (!entry || Date.now() - entry.fetchedAt > SEARCH_MAX_AGE) {
        return undefined;
    }
    return entry.value;
}

export async function setCachedSearch(domain: string, serviceId: string | null): Promise<void> {
    const cache = await searchCacheItem.getValue();
    cache[domain] = { value: serviceId, fetchedAt: Date.now() };
    await searchCacheItem.setValue(prune(cache, SEARCH_MAX_AGE, SEARCH_MAX_ENTRIES));
}

export async function clearPopupCaches(): Promise<void> {
    await Promise.all([detailsCacheItem.removeValue(), searchCacheItem.removeValue()]);
}

function prune<T>(cache: Cache<T>, maxAge: number, maxEntries: number): Cache<T> {
    const now = Date.now();
    const kept = Object.entries(cache)
        .filter(([, entry]) => now - entry.fetchedAt <= maxAge)
        .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
        .slice(0, maxEntries);
    return Object.fromEntries(kept);
}
