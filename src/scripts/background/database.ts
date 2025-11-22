import { API_HEADERS, DEFAULT_API_URL } from '../constants';
import { getLocal, setLocal } from '../lib/chromeStorage';
import type { DatabaseEntry } from './types';

export async function resolveApiUrl(): Promise<string> {
    const data = await getLocal('api');
    const api = data['api'];
    if (typeof api === 'string' && api.length > 0) {
        return api;
    }
    return DEFAULT_API_URL;
}

export async function downloadDatabase(apiUrl?: string): Promise<void> {
    const targetApi = apiUrl ?? (await resolveApiUrl());

    try {
        const response = await fetch(`https://${targetApi}/appdb/version/v2`, {
            headers: API_HEADERS,
        });

        if (response.status >= 300) {
            chrome.action.setBadgeText({ text: `err ${response.status}` });
            return;
        }

        const data = (await response.json()) as DatabaseEntry[];

        await setLocal({
            db: data,
            lastModified: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to download database', error);
    }
}

export async function checkIfUpdateNeeded(firstStart = false, addonInstallReason:chrome.runtime.InstalledDetails | undefined): Promise<void> {
    const data = await getLocal([
        'db',
        'lastModified',
        'interval',
        'api',
    ]);

    const api = await resolveApiUrlFromData(data);

    const db = data['db'] as DatabaseEntry[] | undefined;
    const lastModifiedRaw = data['lastModified'];

    if (db && typeof lastModifiedRaw === 'string') {
        const intervalDays = computeIntervalDays(data['interval']);
        const lastModified = new Date(lastModifiedRaw);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastModified.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < intervalDays) {
            return;
        }
    }

    await downloadDatabase(api);

    if (firstStart && addonInstallReason && addonInstallReason["reason"] === "update" || "install") {
        chrome.runtime.openOptionsPage();
    }
}

function computeIntervalDays(rawValue: unknown): number {
    const DEFAULT_INTERVAL = 8;
    if (typeof rawValue === 'number') {
        return rawValue + 1;
    }
    if (typeof rawValue === 'string') {
        const parsed = Number(rawValue);
        if (!Number.isNaN(parsed)) {
            return parsed + 1;
        }
    }
    return DEFAULT_INTERVAL;
}

async function resolveApiUrlFromData(data: Record<string, unknown>): Promise<string> {
    const api = data['api'];
    if (typeof api === 'string' && api.length > 0) {
        return api;
    }
    return resolveApiUrl();
}
