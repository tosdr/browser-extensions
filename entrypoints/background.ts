import { browser, type Browser } from 'wxt/browser';
import { clearPopupCaches } from '@/utils/cache';
import { DB_CHECK_ALARM, DB_CHECK_PERIOD_MINUTES } from '@/utils/constants';
import { downloadDatabase, getDatabase, updateDatabaseIfNeeded } from '@/utils/database';
import { checkDonationReminder, donationReminderAllowed } from '@/utils/donation';
import { lookupUrl, parseWebUrl } from '@/utils/serviceDetection';
import { apiItem, dbItem, donationReminderItem, intervalItem } from '@/utils/storage';
import { applyLookupToTab, setTabIcon } from '@/utils/tabUi';

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(({ reason }) => {
        void (async () => {
            if (reason === 'install') {
                await donationReminderItem.setValue({
                    active: false,
                    allowedPlattform: donationReminderAllowed(navigator.userAgent),
                });
            }
            await ensureAlarm();
            await updateDatabaseIfNeeded();
            await refreshAllTabs();
            if (reason === 'install') {
                await browser.runtime.openOptionsPage();
            }
        })();
    });

    browser.runtime.onStartup.addListener(() => {
        void ensureAlarm().then(updateDatabaseIfNeeded);
    });

    browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === DB_CHECK_ALARM) {
            void updateDatabaseIfNeeded();
        }
    });

    browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
        if (changeInfo.url !== undefined || changeInfo.status === 'complete') {
            void updateTab(tab);
        }
    });

    browser.tabs.onActivated.addListener(({ tabId }) => {
        browser.tabs.get(tabId).then(updateTab, () => {});
    });

    dbItem.watch(() => {
        void clearPopupCaches();
        void refreshAllTabs();
    });

    donationReminderItem.watch(() => void refreshAllTabs());

    intervalItem.watch(() => void updateDatabaseIfNeeded());

    apiItem.watch(() => {
        void clearPopupCaches();
        void downloadDatabase();
    });

    void ensureAlarm();
    void checkDonationReminder();
});

async function ensureAlarm(): Promise<void> {
    const existing = await browser.alarms.get(DB_CHECK_ALARM);
    if (!existing) {
        await browser.alarms.create(DB_CHECK_ALARM, {
            delayInMinutes: 1,
            periodInMinutes: DB_CHECK_PERIOD_MINUTES,
        });
    }
}

async function updateTab(tab: Browser.tabs.Tab): Promise<void> {
    const tabId = tab.id;
    if (tabId === undefined) {
        return;
    }
    if (!parseWebUrl(tab.url)) {
        await applyLookupToTab(tab, { kind: 'unsupported' });
        return;
    }

    let db = await dbItem.getValue();
    if (!db) {
        await setTabIcon(tabId, 'loading');
        db = await getDatabase();
        const current = await browser.tabs.get(tabId).catch(() => null);
        if (!current) {
            return;
        }
        tab = current;
    }
    await applyLookupToTab(tab, lookupUrl(tab.url, db));
}

async function refreshAllTabs(): Promise<void> {
    const tabs = await browser.tabs.query({});
    const db = await dbItem.getValue();
    await Promise.all(tabs.map((tab) => applyLookupToTab(tab, lookupUrl(tab.url, db))));
}
