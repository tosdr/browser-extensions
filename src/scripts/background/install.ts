import { setLocal } from '../lib/chromeStorage';
import { checkIfUpdateNeeded } from './database';
import { donationReminderAllowed } from './donation';
import { initializePageAction } from './pageAction';

export async function handleExtensionInstalled(reason:chrome.runtime.InstalledDetails): Promise<void> {
    const donationAllowed = donationReminderAllowed(navigator.userAgent);

    await setLocal({
        themeHeader: true,
        sentry: false,
        displayDonationReminder: {
            active: false,
            allowedPlattform: donationAllowed,
        },
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
