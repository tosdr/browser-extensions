import { donationReminderItem, lastDismissedReminderItem } from './storage';

export function donationReminderAllowed(userAgent: string): boolean {
    // apple does not allow donation prompts in the app store
    const isAppleSafari =
        userAgent.includes('Mac') &&
        userAgent.includes('Safari') &&
        !userAgent.includes('Chrome') &&
        !userAgent.includes('Firefox');
    return !isAppleSafari;
}

// activates the yearly donation reminder if it hasn't been dismissed this year
export async function checkDonationReminder(): Promise<boolean> {
    const state = await donationReminderItem.getValue();
    if (state?.active) {
        return true;
    }
    if (state?.allowedPlattform !== true) {
        return false;
    }

    const lastDismissed = await lastDismissedReminderItem.getValue();
    const currentYear = new Date().getFullYear();
    if (lastDismissed?.year !== undefined && currentYear <= lastDismissed.year) {
        return false;
    }

    await donationReminderItem.setValue({ ...state, active: true });
    return true;
}

export async function dismissDonationReminder(): Promise<void> {
    const state = await donationReminderItem.getValue();
    const now = new Date();
    await Promise.all([
        lastDismissedReminderItem.setValue({
            month: now.getMonth(),
            year: now.getFullYear(),
        }),
        donationReminderItem.setValue({ ...state, active: false }),
    ]);
}
