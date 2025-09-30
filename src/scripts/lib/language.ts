export const SUPPORTED_LANGUAGES = ['en', 'de', 'nl', 'fr', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(
    value: string
): SupportedLanguage | undefined {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return undefined;
    }

    const baseCode = trimmed.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(baseCode as SupportedLanguage)) {
        return baseCode as SupportedLanguage;
    }

    return undefined;
}

export function detectBrowserLanguage(): SupportedLanguage {
    const candidateLanguages: string[] = [];

    if (typeof navigator !== 'undefined') {
        if (Array.isArray(navigator.languages)) {
            candidateLanguages.push(...navigator.languages);
        }

        if (typeof navigator.language === 'string') {
            candidateLanguages.push(navigator.language);
        }
    }

    for (const candidate of candidateLanguages) {
        const normalized = normalizeLanguage(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return 'en';
}

export function resolveLanguage(candidate: unknown): SupportedLanguage {
    if (typeof candidate === 'string') {
        const normalized = normalizeLanguage(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return detectBrowserLanguage();
}
