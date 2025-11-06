import {
    ALLOWED_PROTOCOLS,
    DEFAULT_POPUP_PATH,
} from '../constants';
import { getLocal } from '../lib/chromeStorage';
import type { DatabaseEntry } from './types';
import { findServiceMatch } from './serviceDetection';
import {
    serviceDetected,
    setPopup,
    setTabBadgeNotification,
    setTabIcon,
} from './tabUi';
import { downloadDatabase, resolveApiUrl } from './database';

export async function initializePageAction(
    tab?: chrome.tabs.Tab | null
): Promise<void> {
    if (!tab || !tab.url) {
        setPopup(null, DEFAULT_POPUP_PATH);
        setTabIcon(tab, 'logo');
        await setTabBadgeNotification(true, tab);
        return;
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(tab.url);
    } catch (error) {
        console.error('Invalid URL for tab', error);
        setPopup(tab.id, DEFAULT_POPUP_PATH);
        setTabIcon(tab, 'logo');
        await setTabBadgeNotification(true, tab);
        return;
    }

    if (!isAllowedProtocol(parsedUrl.protocol)) {
        setPopup(tab.id, DEFAULT_POPUP_PATH);
        setTabIcon(tab, 'logo');
        await setTabBadgeNotification(true, tab);
        return;
    }

    if (tab.url.trim() === '') {
        setPopup(tab.id, DEFAULT_POPUP_PATH);
        setTabIcon(tab, 'logo');
        await setTabBadgeNotification(true, tab);
        return;
    }

    setTabIcon(tab, 'loading');
    await setTabBadgeNotification(false, tab);

    const db = await getDatabase();
    if (!db) {
        setPopup(tab.id, DEFAULT_POPUP_PATH);
        setTabIcon(tab, 'logo');
        await setTabBadgeNotification(true, tab);
        return;
    }

    const { service, normalizedDomain } = findServiceMatch(
        parsedUrl.hostname,
        db
    );

    if (service) {
        await serviceDetected(tab, service);
        return;
    }

    setPopup(tab.id, `${DEFAULT_POPUP_PATH}?url=${normalizedDomain}`);
    setTabIcon(tab, 'notfound');
}

async function getDatabase(): Promise<DatabaseEntry[] | undefined> {
    const stored = await getLocal('db');
    let db = stored['db'] as DatabaseEntry[] | undefined;

    if (db) {
        return db;
    }

    await downloadDatabase(await resolveApiUrl());

    const refreshed = await getLocal('db');
    db = refreshed['db'] as DatabaseEntry[] | undefined;
    return db;
}

function isAllowedProtocol(protocol: string): boolean {
    return (ALLOWED_PROTOCOLS as readonly string[]).includes(protocol);
}
