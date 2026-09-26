import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import {
    type ServiceDetails,
    fetchServiceDetails,
    formatUnknownError,
    searchServiceByDomain,
} from '@/utils/api';
import {
    getCachedDetails,
    getCachedSearch,
    setCachedDetails,
    setCachedSearch,
} from '@/utils/cache';
import { getDatabase } from '@/utils/database';
import { type SupportedLanguage, resolveLanguage } from '@/utils/language';
import { lookupUrl } from '@/utils/serviceDetection';
import {
    curatorModeItem,
    getApiUrl,
    languageItem,
    themeHeaderItem,
    themeHeaderRatingItem,
} from '@/utils/storage';

export interface PopupPreferences {
    curatorMode: boolean;
    themeHeader: boolean;
    themeHeaderRating: boolean;
    language: SupportedLanguage;
}

export type PopupState =
    | { kind: 'loading' }
    | { kind: 'error'; title: string; description: string }
    | { kind: 'no-service'; domain?: string; databaseMissing?: boolean }
    | {
          kind: 'service';
          serviceId: string;
          details: ServiceDetails;
          fromSearch: boolean;
      };

export function usePopupData() {
    const [state, setState] = useState<PopupState>({ kind: 'loading' });
    const [prefs, setPrefs] = useState<PopupPreferences | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState({ kind: 'loading' });
        void (async () => {
            const loadedPrefs = await loadPreferences();
            const next = await loadPopupState(loadedPrefs.language, (refreshed) => {
                if (!cancelled) {
                    setState(refreshed);
                }
            });
            if (!cancelled) {
                setPrefs(loadedPrefs);
                setState(next);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return { state, prefs, retry };
}

async function loadPreferences(): Promise<PopupPreferences> {
    const [curatorMode, themeHeader, themeHeaderRating, language] = await Promise.all([
        curatorModeItem.getValue(),
        themeHeaderItem.getValue(),
        themeHeaderRatingItem.getValue(),
        languageItem.getValue(),
    ]);
    return {
        curatorMode,
        themeHeader,
        themeHeaderRating,
        language: resolveLanguage(language),
    };
}

async function loadPopupState(
    language: SupportedLanguage,
    onRefresh: (state: PopupState) => void
): Promise<PopupState> {
    const [[tab], db, api] = await Promise.all([
        browser.tabs.query({ active: true, currentWindow: true }),
        getDatabase(),
        getApiUrl(),
    ]);

    const lookup = lookupUrl(tab?.url, db);
    let serviceId: string;
    let fromSearch = false;

    if (lookup.kind === 'unsupported') {
        return { kind: 'no-service' };
    }

    if (lookup.kind === 'found') {
        serviceId = lookup.service.id;
    } else {
        let found = await getCachedSearch(lookup.domain);
        if (found === undefined) {
            try {
                found = await searchServiceByDomain(api, lookup.domain);
                await setCachedSearch(lookup.domain, found);
            } catch (error) {
                return {
                    kind: 'error',
                    title: 'Unable to search for this site.',
                    description: formatUnknownError(error),
                };
            }
        }
        if (!found) {
            return {
                kind: 'no-service',
                domain: lookup.domain,
                databaseMissing: lookup.kind === 'no-database',
            };
        }
        serviceId = found;
        fromSearch = true;
    }

    const fetchAndCache = async () => {
        const details = await fetchServiceDetails(api, serviceId, language);
        await setCachedDetails(serviceId, language, details);
        return { kind: 'service', serviceId, details, fromSearch } as const;
    };

    const cached = await getCachedDetails(serviceId, language);
    if (cached) {
        if (cached.stale) {
            fetchAndCache().then(onRefresh, (error) =>
                console.warn('Background refresh of service details failed', error)
            );
        }
        return { kind: 'service', serviceId, details: cached.details, fromSearch };
    }

    try {
        return await fetchAndCache();
    } catch (error) {
        return {
            kind: 'error',
            title: 'Unable to load service details.',
            description: formatUnknownError(error),
        };
    }
}
