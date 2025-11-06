import { DONATION_BADGE_TEXT } from '../constants';
import { getLocal, setLocal } from '../lib/chromeStorage';
import type { DonationReminderState } from './types';

export async function checkDonationReminder(): Promise<void> {
    const data = await getLocal('displayDonationReminder');
    const displayDonationReminder = data['displayDonationReminder'] as
        | DonationReminderState
        | undefined;

    const isActive = displayDonationReminder?.active === true;
    const allowed = displayDonationReminder?.allowedPlattform === true;

    if (!isActive && allowed) {
        const currentYear = new Date().getFullYear();

        try {
            const reminderData = await getLocal('lastDismissedReminder');
            const lastDismissedReminder = reminderData['lastDismissedReminder'] as
                | { year?: number }
                | undefined;
            const lastDismissedYear = lastDismissedReminder?.year;

            if (lastDismissedYear === undefined || currentYear > lastDismissedYear) {
                chrome.action.setBadgeText({ text: DONATION_BADGE_TEXT });
                await setLocal({
                    displayDonationReminder: {
                        active: true,
                        allowedPlattform:
                            displayDonationReminder?.allowedPlattform ?? true,
                    },
                });
            }
        } catch (error) {
            console.error('Error in checkDonationReminder:', error);
        }

        return;
    }

    chrome.action.setBadgeText({ text: DONATION_BADGE_TEXT });
}

export function donationReminderAllowed(userAgent: string): boolean {
    const isMac = userAgent.includes('Mac');
    const isSafari = userAgent.includes('Safari');
    return !(isMac && isSafari);
}
