import { DEFAULT_POPUP_PATH, DONATION_BADGE_TEXT } from '../constants';
import { getLocal } from '../lib/chromeStorage';
import type { DonationReminderState, Service } from './types';

export function setPopup(
    tabId: number | undefined | null,
    popup: string = DEFAULT_POPUP_PATH
): void {
    if (typeof tabId !== 'number') {
        chrome.action.setPopup({ popup });
        return;
    }

    chrome.action.setPopup({ tabId, popup });
}

export function setTabIcon(
    tab: chrome.tabs.Tab | null | undefined,
    icon: string
): void {
    const iconDetails: chrome.action.TabIconDetails = {
        path: {
            32: `/icons/${icon}/${icon}32.png`,
            48: `/icons/${icon}/${icon}48.png`,
            128: `/icons/${icon}/${icon}128.png`,
        },
    };

    if (tab?.id) {
        iconDetails.tabId = tab.id;
    }

    chrome.action.setIcon(iconDetails);
}

export async function setTabBadgeNotification(
    on: boolean,
    tab?: chrome.tabs.Tab | null
): Promise<void> {
    if (!tab?.id) {
        return;
    }

    const data = await getLocal('displayDonationReminder');
    const reminder = data['displayDonationReminder'] as
        | DonationReminderState
        | undefined;

    if (on && reminder?.active) {
        chrome.action.setBadgeText({ text: DONATION_BADGE_TEXT, tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: 'red' });
        return;
    }

    chrome.action.setBadgeText({ text: '', tabId: tab.id });
}

export async function serviceDetected(
    tab: chrome.tabs.Tab,
    service: Service
): Promise<void> {
    setTabIcon(tab, service.rating.toLowerCase());
    setPopup(tab.id, `${DEFAULT_POPUP_PATH}?service-id=${service.id}`);
    await setTabBadgeNotification(false, tab);
}
