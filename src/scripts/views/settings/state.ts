import { getLocal } from '../../lib/chromeStorage';
import { resolveLanguage } from '../../lib/language';

export async function populateSettingsForm(): Promise<void> {
    const elements = collectElements();
    const result = await getLocal([
        'db',
        'lastModified',
        'interval',
        'themeHeader',
        'themeHeaderRating',
        'curatorMode',
        'sentry',
        'api',
        'language',
        'pointListStyle'
    ]);

    if (Array.isArray(result['db'])) {
        const lastModified = new Date(String(result['lastModified']));
        if (!Number.isNaN(lastModified.getTime()) && elements.date) {
            elements.date.textContent = lastModified.toLocaleDateString('en-US');
        }
        if (elements.indexed) {
            elements.indexed.textContent = String(result['db'].length);
        }
    } else {
        removeDatabaseIndicators();
    }

    if (typeof result['interval'] === 'number' || typeof result['interval'] === 'string') {
        if (elements.days) {
            elements.days.textContent = String(result['interval']);
        }
        if (elements.updateInput) {
            elements.updateInput.value = String(result['interval']);
        }
    }

    if (elements.themeInput) {
        elements.themeInput.checked = Boolean(result['themeHeader']);
    }

    if (elements.themeRatingInput) {
        elements.themeRatingInput.checked = Boolean(result['themeHeaderRating']);
    }

    if (elements.curatorModeInput) {
        elements.curatorModeInput.checked = Boolean(result['curatorMode']);
    }

    if (elements.apiInput && typeof result['api'] === 'string') {
        elements.apiInput.value = result['api'];
    }

    if (elements.languageSelect) {
        const language = resolveLanguage(result['language']);
        elements.languageSelect.value = language;
    }
    if (elements.pointListStyle) {
        elements.pointListStyle.value = String(result['pointListStyle']);
    }
}

function collectElements() {
    return {
        updateInput: document.getElementById('update') as HTMLInputElement | null,
        themeInput: document.getElementById('theme') as HTMLInputElement | null,
        themeRatingInput: document.getElementById('themeRating') as HTMLInputElement | null,
        curatorModeInput: document.getElementById('curatorMode') as HTMLInputElement | null,
        apiInput: document.getElementById('api') as HTMLInputElement | null,
        languageSelect: document.getElementById('language') as HTMLSelectElement | null,
        date: document.getElementById('date') as HTMLElement | null,
        indexed: document.getElementById('indexed') as HTMLElement | null,
        days: document.getElementById('days') as HTMLElement | null,
        pointListStyle: document.getElementById('pointListStyle') as HTMLSelectElement | null
    };
}

function removeDatabaseIndicators(): void {
    const availableElements = document.getElementsByClassName('dbavailable');
    Array.from(availableElements).forEach((element) => element.remove());
}
