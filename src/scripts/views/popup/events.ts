import { setLocal } from '../../lib/chromeStorage';

export function registerUiEventHandlers(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupHandlers, { once: true });
    } else {
        setupHandlers();
    }
}

function setupHandlers(): void {
    const toggleButton = document.getElementById('toggleButton');
    const settingsButton = document.getElementById('settingsButton');
    const sourceButton = document.getElementById('sourceButton');
    const donationButton = document.getElementById('donationButton');
    const source = document.getElementById('source');
    const opentosdr = document.getElementById('opentosdr');

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const body = document.querySelector('body');
            if (!body) {
                return;
            }

            body.classList.toggle('dark-mode');
            const darkmode = body.classList.contains('dark-mode');
            void setLocal({ darkmode });
        });
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    if (sourceButton) {
        sourceButton.addEventListener('click', () => {
            window.open('https://github.com/tosdr/browser-extensions');
        });
    }

    if (donationButton) {
        donationButton.addEventListener('click', () => {
            window.open('https://tosdr.org/en/sites/donate');
        });
    }

    if (source) {
        source.addEventListener('click', () => {
            window.open('https://github.com/tosdr');
        });
    }

    if (opentosdr) {
        opentosdr.addEventListener('click', () => {
            window.open('https://tosdr.org/');
        });
    }
}
