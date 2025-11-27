import { setLocal } from '../lib/chromeStorage';
import { checkIfUpdateNeeded } from './database';
import { donationReminderAllowed } from './donation';
import { initializePageAction } from './pageAction';
import { DEFAULT_LIST_STYLE } from "../constants";

export async function handleExtensionInstalled(reason:chrome.runtime.InstalledDetails): Promise<void> {
    const donationAllowed = donationReminderAllowed(navigator.userAgent);

    await setLocal({
        themeHeader: true,
        sentry: false,
        displayDonationReminder: {
            active: false,
            allowedPlattform: donationAllowed,
        },
        pointListStyle: DEFAULT_LIST_STYLE
    });

    await checkIfUpdateNeeded(true, reason);

    const [activeTab] = await queryActiveTab();
    if (activeTab) {
        await initializePageAction(activeTab);
    }
}

async function queryActiveTab(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs);
        });
    });
}
