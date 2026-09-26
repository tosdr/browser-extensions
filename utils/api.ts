import type { SupportedLanguage } from './language';
import { REQUEST_TIMEOUT_MS } from './url';

export type Classification = 'blocker' | 'bad' | 'good' | 'neutral';

export interface ServicePoint {
    id: number;
    title: string;
    source?: string | null;
    status: string;
    case?: {
        title?: string;
        localized_title?: string | null;
        description?: string | null;
        classification?: Classification;
        weight?: number;
    } | null;
}

export interface ServiceDocument {
    id: number;
    name: string;
    url: string;
    updated_at?: string;
}

export interface ServiceDetails {
    id: number;
    name: string;
    rating?: string | null;
    is_comprehensively_reviewed?: boolean;
    updated_at?: string;
    image?: string | null;
    urls?: string[];
    documents?: ServiceDocument[];
    points: ServicePoint[];
}

interface SearchResponse {
    services?: Array<{ id: number | string; urls?: string[] }>;
}

export class ApiError extends Error {}

export async function fetchServiceDetails(
    api: string,
    id: string,
    language: SupportedLanguage
): Promise<ServiceDetails> {
    const response = await fetch(
        `https://${api}/service/v3?id=${encodeURIComponent(id)}&lang=${encodeURIComponent(language)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!response.ok) {
        throw new ApiError(await formatHttpError(response));
    }
    return (await response.json()) as ServiceDetails;
}

export async function searchServiceByDomain(
    api: string,
    domain: string
): Promise<string | null> {
    const response = await fetch(
        `https://${api}/search/v5/?query=${encodeURIComponent(domain)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!response.ok) {
        throw new ApiError(await formatHttpError(response));
    }

    const data = (await response.json()) as SearchResponse;
    const match = data.services?.find((service) => service.urls?.includes(domain));
    return match ? String(match.id) : null;
}

async function formatHttpError(response: Response): Promise<string> {
    const statusSummary = `${response.status} ${response.statusText}`.trim();

    try {
        const bodyText = (await response.text()).trim();
        if (!bodyText) {
            return statusSummary || 'Request failed.';
        }

        let message = bodyText;
        if ((response.headers.get('content-type') ?? '').includes('application/json')) {
            try {
                const parsed = JSON.parse(bodyText) as { error?: unknown; message?: unknown };
                if (typeof parsed?.message === 'string') {
                    message = parsed.message;
                } else if (typeof parsed?.error === 'string') {
                    message = parsed.error;
                }
            } catch {
                // Fall back to the raw body text.
            }
        }

        if (message.length > 200 || message.startsWith('<')) {
            message = message.startsWith('<') ? '' : `${message.slice(0, 200)}…`;
        }
        if (!message) {
            return statusSummary || 'Request failed.';
        }
        return statusSummary ? `${statusSummary} – ${message}` : message;
    } catch {
        return statusSummary || 'Request failed.';
    }
}

export function formatUnknownError(error: unknown): string {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
        return 'The ToS;DR API took too long to respond.';
    }
    if (error instanceof TypeError) {
        return `Could not reach the ToS;DR API (${error.message}).`;
    }
    if (error instanceof Error) {
        return error.message || error.name;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return 'An unexpected error occurred.';
    }
}
