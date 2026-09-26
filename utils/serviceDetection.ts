import { ALLOWED_PROTOCOLS, GRADES, MAX_DOMAIN_REDUCTIONS } from './constants';
import type { DatabaseEntry } from './storage';

export interface Service {
    id: string;
    name?: string;
    rating: string;
}

export type Grade = (typeof GRADES)[number];

export type TabLookup =
    | { kind: 'unsupported' }
    | { kind: 'no-database'; domain: string }
    | { kind: 'found'; service: Service; domain: string }
    | { kind: 'not-found'; domain: string };

export function toGrade(rating: string | null | undefined): Grade | null {
    const upper = rating?.toUpperCase();
    return (GRADES as readonly string[]).includes(upper ?? '')
        ? (upper as Grade)
        : null;
}

export function parseWebUrl(url: string | undefined): URL | null {
    if (!url || url.trim() === '') {
        return null;
    }
    try {
        const parsed = new URL(url);
        return (ALLOWED_PROTOCOLS as readonly string[]).includes(parsed.protocol)
            ? parsed
            : null;
    } catch {
        return null;
    }
}

export function lookupUrl(
    url: string | undefined,
    db: DatabaseEntry[] | null
): TabLookup {
    const parsed = parseWebUrl(url);
    if (!parsed) {
        return { kind: 'unsupported' };
    }
    // fully-qualified names like github.com. are the same site
    const hostname = parsed.hostname.replace(/\.$/, '');
    if (!db) {
        return { kind: 'no-database', domain: hostname.replace(/^www\./, '') };
    }

    const { service, normalizedDomain } = findServiceMatch(hostname, db);
    return service
        ? { kind: 'found', service, domain: normalizedDomain }
        : { kind: 'not-found', domain: normalizedDomain };
}

export function findServiceMatch(
    hostname: string,
    db: DatabaseEntry[]
): { service: Service | null; normalizedDomain: string } {
    let domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;

    for (let attempt = 0; attempt <= MAX_DOMAIN_REDUCTIONS; attempt++) {
        const match = lookupDomain(domain, db);
        if (match) {
            return { service: match, normalizedDomain: domain };
        }

        const reduced = reduceDomain(domain);
        if (!reduced) {
            break;
        }
        domain = reduced;
    }

    return { service: null, normalizedDomain: domain };
}

function reduceDomain(domain: string): string | null {
    const parts = domain.split('.');
    return parts.length <= 2 ? null : parts.slice(1).join('.');
}

function lookupDomain(domain: string, db: DatabaseEntry[]): Service | null {
    const match = db.find((entry) =>
        entry.url.split(',').some((url) => url.trim() === domain)
    );
    return match
        ? { id: String(match.id), name: match.name, rating: match.rating }
        : null;
}
