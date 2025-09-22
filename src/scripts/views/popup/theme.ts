import { getLocal } from '../../lib/chromeStorage';

export async function applyHeaderTheme(serviceId: string): Promise<void> {
    const result = await getLocal('themeHeader');
    if (!result['themeHeader']) {
        return;
    }

    const blurredTemplate = `.header::before {
        content: '';
        position: absolute;
        background-image: url('https://s3.tosdr.org/logos/${serviceId}.png');
        top: 0;
        left: 0;
        width: 100%;
        height: 90%;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        filter: blur(30px);
        z-index: -2;
    }`;

    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    styleElement.sheet?.insertRule(blurredTemplate);
}

export async function applyHeaderColor(rating: string): Promise<void> {
    const result = await getLocal('themeHeaderRating');
    if (!result['themeHeaderRating']) {
        return;
    }

    const header = document.getElementById('headerPopup');
    if (!header) {
        return;
    }

    header.classList.add(rating);
}
