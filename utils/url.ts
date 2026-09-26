export function safeHttpUrl(value: string | null | undefined): string | undefined {
    if (!value) {
        return undefined;
    }
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
    } catch {
        return undefined;
    }
}

export function normalizeHost(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }
    try {
        return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).host;
    } catch {
        return '';
    }
}

export const REQUEST_TIMEOUT_MS = 15_000;
