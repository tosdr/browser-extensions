import { hydrateState } from './popup/state';
import { registerUiEventHandlers } from './popup/events';
import { initializePopupFromLocation } from './popup/navigation';
import { adjustLayoutForFirefoxDesktop } from './popup/layout';

void (async function initPopup(): Promise<void> {
    await waitForDomReady();

    const preferences = await hydrateState();
    applyPreferences(preferences);

    registerUiEventHandlers();
    await initializePopupFromLocation(window.location.href);
    adjustLayoutForFirefoxDesktop();
})();

function applyPreferences(preferences: {
    darkmode: boolean;
    curatorMode: boolean;
}): void {
    if (preferences.darkmode) {
        document.body.classList.add('dark-mode');
    }

    const curatorElement = document.getElementById('curator');
    if (!curatorElement) {
        return;
    }

    curatorElement.style.display = preferences.curatorMode ? 'block' : 'none';
}

async function waitForDomReady(): Promise<void> {
    if (document.readyState !== 'loading') {
        return;
    }

    await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), {
            once: true,
        });
    });
}
