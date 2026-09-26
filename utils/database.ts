import { API_HEADERS } from './constants';
import { formatUnknownError } from './api';
import { REQUEST_TIMEOUT_MS } from './url';
import {
    type DatabaseEntry,
    dbItem,
    dbStatusItem,
    getApiUrl,
    getIntervalDays,
    lastModifiedItem,
} from './storage';

const DAY_MS = 1000 * 60 * 60 * 24;

let inFlight: Promise<boolean> | null = null;

export function downloadDatabase(): Promise<boolean> {
    inFlight ??= fetchAndStoreDatabase().finally(() => {
        inFlight = null;
    });
    return inFlight;
}

async function fetchAndStoreDatabase(): Promise<boolean> {
    const api = await getApiUrl();
    const checkedAt = new Date().toISOString();

    try {
        const response = await fetch(`https://${api}/appdb/version/v2`, {
            headers: API_HEADERS,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
        }

        const raw: unknown = await response.json();
        if (!Array.isArray(raw)) {
            throw new Error('Unexpected database format');
        }
        const data = raw.filter(isDatabaseEntry);
        if (data.length === 0) {
            throw new Error('Database is empty');
        }

        await Promise.all([
            dbItem.setValue(data),
            lastModifiedItem.setValue(checkedAt),
            dbStatusItem.setValue({ state: 'ok', checkedAt }),
        ]);
        return true;
    } catch (error) {
        console.error('Failed to download database', error);
        await dbStatusItem.setValue({
            state: 'error',
            checkedAt,
            message: formatUnknownError(error),
        });
        return false;
    }
}

function isDatabaseEntry(value: unknown): value is DatabaseEntry {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const entry = value as Record<string, unknown>;
    return (
        (typeof entry.id === 'number' || typeof entry.id === 'string') &&
        typeof entry.url === 'string' &&
        typeof entry.rating === 'string'
    );
}

export async function isDatabaseStale(): Promise<boolean> {
    const [db, lastModified, intervalDays] = await Promise.all([
        dbItem.getValue(),
        lastModifiedItem.getValue(),
        getIntervalDays(),
    ]);

    if (!db || !lastModified) {
        return true;
    }

    const age = Date.now() - new Date(lastModified).getTime();
    return Number.isNaN(age) || age >= intervalDays * DAY_MS;
}

export async function updateDatabaseIfNeeded(): Promise<void> {
    if (await isDatabaseStale()) {
        await downloadDatabase();
    }
}

export async function getDatabase(): Promise<DatabaseEntry[] | null> {
    const db = await dbItem.getValue();
    if (db) {
        return db;
    }
    await downloadDatabase();
    return dbItem.getValue();
}
