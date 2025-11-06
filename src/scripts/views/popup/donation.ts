import { getLocal, setLocal } from '../../lib/chromeStorage';

export async function showDonationReminderIfNeeded(): Promise<void> {
    const result = await getLocal('displayDonationReminder');
    const state = result['displayDonationReminder'] as
        | {
              active?: boolean;
              allowedPlattform?: boolean;
          }
        | undefined;

    if (!state?.active) {
        return;
    }

    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const tabs = await queryAllTabs();
        for (const tab of tabs) {
            if (tab.id) {
                await chrome.action.setBadgeText({ text: '', tabId: tab.id });
            }
        }

        await setLocal({
            lastDismissedReminder: {
                month: currentMonth,
                year: currentYear,
            },
            displayDonationReminder: {
                active: false,
                allowedPlattform: state.allowedPlattform,
            },
        });

        const donationReminder = document.getElementById('donationReminder');
        if (donationReminder) {
            donationReminder.style.display = 'block';
        }
    } catch (error) {
        console.error('Error in donation reminder logic:', error);
    }
}

async function queryAllTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => resolve(tabs));
    });
}
