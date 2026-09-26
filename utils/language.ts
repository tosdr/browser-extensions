import { SUPPORTED_LANGUAGES } from './constants';

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    de: 'Deutsch',
    nl: 'Nederlands',
    fr: 'Français',
    es: 'Español',
};

export function normalizeLanguage(value: string): SupportedLanguage | undefined {
    const baseCode = value.trim().toLowerCase().split('-')[0] ?? '';
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(baseCode)
        ? (baseCode as SupportedLanguage)
        : undefined;
}

export function detectBrowserLanguage(): SupportedLanguage {
    const candidates = [...(navigator.languages ?? []), navigator.language];
    for (const candidate of candidates) {
        const normalized = candidate ? normalizeLanguage(candidate) : undefined;
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
