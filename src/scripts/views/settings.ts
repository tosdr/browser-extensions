import { populateSettingsForm } from './settings/state';
import { registerSettingsHandlers } from './settings/handlers';

void (async function initSettings(): Promise<void> {
    await waitForDomReady();
    await populateSettingsForm();
    registerSettingsHandlers();
})();

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
