import { browser, type Browser } from 'wxt/browser';
import { DONATION_BADGE_TEXT } from './constants';
import { type TabLookup, toGrade } from './serviceDetection';
import { donationReminderItem } from './storage';

type IconName = 'logo' | 'loading' | 'notfound' | Lowercase<'A' | 'B' | 'C' | 'D' | 'E'>;

function iconPaths(icon: IconName): Record<number, string> {
    const sizes = icon === 'logo' ? [16, 32, 48, 128] : [32, 48, 64, 128];
    return Object.fromEntries(
        sizes.map((size) => [size, `/icons/${icon}/${icon}${size}.png`])
    );
}

export async function setTabIcon(tabId: number, icon: IconName): Promise<void> {
    await browser.action
        .setIcon({ tabId, path: iconPaths(icon) })
        .catch(() => {
            // the tab may have been closed in the meantime
        });
}

async function setTabTitle(tabId: number, title: string): Promise<void> {
    await browser.action.setTitle({ tabId, title }).catch(() => {});
}

// shows the donation badge on tabs without a rated service, clears it otherwise
async function setTabBadge(tabId: number, allowDonationBadge: boolean): Promise<void> {
    const reminder = await donationReminderItem.getValue();
    const text = allowDonationBadge && reminder?.active ? DONATION_BADGE_TEXT : '';
    await browser.action.setBadgeText({ tabId, text }).catch(() => {});
    if (text) {
        await browser.action
            .setBadgeBackgroundColor({ tabId, color: '#cb444b' })
            .catch(() => {});
    }
}

export async function applyLookupToTab(
    tab: Browser.tabs.Tab,
    lookup: TabLookup
): Promise<void> {
    const tabId = tab.id;
    if (tabId === undefined) {
        return;
    }

    switch (lookup.kind) {
        case 'found': {
            const grade = toGrade(lookup.service.rating);
            const name = lookup.service.name ?? lookup.domain;
            await setTabIcon(tabId, grade ? (grade.toLowerCase() as IconName) : 'notfound');
            await setTabTitle(
                tabId,
                grade ? `ToS;DR – ${name}: Grade ${grade}` : `ToS;DR – ${name}: Not graded yet`
            );
            await setTabBadge(tabId, false);
            return;
        }
        case 'not-found':
            await setTabIcon(tabId, 'notfound');
            await setTabTitle(tabId, `ToS;DR – ${lookup.domain} is not rated`);
            await setTabBadge(tabId, true);
            return;
        case 'no-database':
            await setTabIcon(tabId, 'logo');
            await setTabTitle(tabId, 'ToS;DR – Database unavailable');
            await setTabBadge(tabId, true);
            return;
        case 'unsupported':
            await setTabIcon(tabId, 'logo');
            await setTabTitle(tabId, "Terms of Service; Didn't Read");
            await setTabBadge(tabId, true);
            return;
    }
}
