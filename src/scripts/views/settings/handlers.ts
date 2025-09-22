import { setLocal } from '../../lib/chromeStorage';

export function registerSettingsHandlers(): void {
    const updateInput = document.getElementById('update') as HTMLInputElement | null;
    const themeInput = document.getElementById('theme') as HTMLInputElement | null;
    const themeRatingInput = document.getElementById('themeRating') as HTMLInputElement | null;
    const curatorModeInput = document.getElementById('curatorMode') as HTMLInputElement | null;
    const apiInput = document.getElementById('api') as HTMLInputElement | null;

    if (updateInput) {
        updateInput.addEventListener('change', () => {
            const daysElement = document.getElementById('days');
            if (daysElement) {
                daysElement.textContent = updateInput.value;
            }
            void setLocal({ interval: updateInput.value });
        });
    }

    if (themeInput) {
        themeInput.addEventListener('change', () => {
            void setLocal({ themeHeader: themeInput.checked });
        });
    }

    if (themeRatingInput) {
        themeRatingInput.addEventListener('change', () => {
            void setLocal({ themeHeaderRating: themeRatingInput.checked });
        });
    }

    if (curatorModeInput) {
        curatorModeInput.addEventListener('change', () => {
            void setLocal({ curatorMode: curatorModeInput.checked });
        });
    }

    if (apiInput) {
        apiInput.addEventListener('change', () => {
            void setLocal({ api: apiInput.value });
        });
    }
}
