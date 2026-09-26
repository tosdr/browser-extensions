import { storage } from '#imports';
import { normalizeHost } from './url';
import { DEFAULT_API_URL, DEFAULT_UPDATE_INTERVAL_DAYS } from './constants';
import type { SupportedLanguage } from './language';

export interface DatabaseEntry {
    id: number | string;
    name?: string;
    url: string;
    rating: string;
}

export interface DonationReminderState {
    active?: boolean;
    allowedPlattform?: boolean;
}

export type DatabaseStatus =
    | { state: 'ok'; checkedAt: string }
    | { state: 'error'; checkedAt: string; message: string };

export const dbItem = storage.defineItem<DatabaseEntry[] | null>('local:db', {
    fallback: null,
});

export const lastModifiedItem = storage.defineItem<string | null>(
    'local:lastModified',
    { fallback: null }
);

export const dbStatusItem = storage.defineItem<DatabaseStatus | null>(
    'local:dbStatus',
    { fallback: null }
);

export const intervalItem = storage.defineItem<number | string>(
    'local:interval',
    { fallback: DEFAULT_UPDATE_INTERVAL_DAYS }
);

export const apiItem = storage.defineItem<string>('local:api', {
    fallback: '',
});

export const darkmodeItem = storage.defineItem<boolean | null>(
    'local:darkmode',
    { fallback: null }
);

export const curatorModeItem = storage.defineItem<boolean>(
    'local:curatorMode',
    { fallback: false }
);

export const languageItem = storage.defineItem<SupportedLanguage | null>(
    'local:language',
    { fallback: null }
);

export const themeHeaderItem = storage.defineItem<boolean>(
    'local:themeHeader',
    { fallback: true }
);

export const themeHeaderRatingItem = storage.defineItem<boolean>(
    'local:themeHeaderRating',
    { fallback: false }
);

export const donationReminderItem =
    storage.defineItem<DonationReminderState | null>(
        'local:displayDonationReminder',
        { fallback: null }
    );

export const lastDismissedReminderItem = storage.defineItem<{
    month?: number;
    year?: number;
} | null>('local:lastDismissedReminder', { fallback: null });

export async function getIntervalDays(): Promise<number> {
    const parsed = Number(await intervalItem.getValue());
    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_UPDATE_INTERVAL_DAYS;
}

export async function getApiUrl(): Promise<string> {
    return normalizeHost(await apiItem.getValue()) || DEFAULT_API_URL;
}
