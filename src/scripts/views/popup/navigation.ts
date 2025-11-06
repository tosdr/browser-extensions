import { showDonationReminderIfNeeded } from './donation';
import { displayServiceDetails, searchService } from './service';
import { applyHeaderTheme } from './theme';

export async function initializePopupFromLocation(locationHref: string): Promise<void> {
    const serviceId = extractServiceId(locationHref);

    if (!serviceId) {
        await handleUrlParameter(locationHref);
        return;
    }

    if (serviceId === '-1') {
        await handleMissingServiceId();
        return;
    }

    configureServiceButtons(serviceId);
    updateLogo(serviceId);
    updateServiceIdentifier(serviceId);
    void applyHeaderTheme(serviceId);

    await displayServiceDetails(serviceId);
}

async function handleUrlParameter(locationHref: string): Promise<void> {
    const url = extractUrlParameter(locationHref);
    if (!url) {
        await showMissingServiceUi();
        return;
    }

    const result = await searchService(url);

    if (result) {
        configureServiceButtons(result);
        updateLogo(result);
        updateServiceIdentifier(result);
        void applyHeaderTheme(result);
        await displayServiceDetails(result, { unverified: true });
        return;
    }

    await showMissingServiceUi();
}

async function handleMissingServiceId(): Promise<void> {
    await showDonationReminderIfNeeded();
    updateServiceIdentifier('Error: no service-id in url');
    hideElement('loading');
    hideElement('loaded');
    showElement('nourl', 'block');
    showElement('notreviewed', 'block');
    hideElement('pointList');

    const editTextElement = document.getElementById('edittext');
    if (editTextElement) {
        editTextElement.onclick = () => {
            window.open('https://edit.tosdr.org');
        };
    }
}

async function showMissingServiceUi(): Promise<void> {
    await showDonationReminderIfNeeded();

    updateServiceIdentifier('Error: no service-id in url');
    hideElement('loading');
    hideElement('loaded');
    showElement('nourl', 'block');
    hideElement('pointList');
}

function configureServiceButtons(serviceId: string): void {
    const phoenixButton = document.getElementById('phoenixButton');
    if (phoenixButton) {
        phoenixButton.onclick = () => {
            window.open(`https://edit.tosdr.org/services/${serviceId}`);
        };
    }

    const webbutton = document.getElementById('webbutton');
    if (webbutton) {
        webbutton.onclick = () => {
            window.open(`https://tosdr.org/en/service/${serviceId}`);
        };
    }
}

function updateLogo(serviceId: string): void {
    const logo = document.getElementById('logo') as HTMLImageElement | null;
    if (logo) {
        logo.src = `https://s3.tosdr.org/logos/${serviceId}.png`;
    }
}

function updateServiceIdentifier(message: string): void {
    const idElement = document.getElementById('id');
    if (idElement) {
        idElement.innerText = message;
    }
}

function extractServiceId(locationHref: string): string | undefined {
    const match = locationHref.split('?service-id=')[1];
    if (!match) {
        return undefined;
    }
    return match.replace('#', '');
}

function extractUrlParameter(locationHref: string): string | undefined {
    const match = locationHref.split('?url=')[1];
    if (!match) {
        return undefined;
    }
    return match;
}

function hideElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function showElement(elementId: string, display: string): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = display;
    }
}
