import { MAX_DOMAIN_REDUCTIONS } from '../constants';
import type { DatabaseEntry, Service } from './types';

export interface ServiceMatchResult {
    service: Service | null;
    normalizedDomain: string;
}

export function findServiceMatch(
    hostname: string,
    db: DatabaseEntry[]
): ServiceMatchResult {
    let domain = stripWwwPrefix(hostname);

    const directMatch = lookupDomain(domain, db);
    if (directMatch) {
        return { service: directMatch, normalizedDomain: domain };
    }

    let attempts = 0;
    while (attempts < MAX_DOMAIN_REDUCTIONS) {
        const reduced = reduceDomain(domain);
        if (!reduced) {
            break;
        }

        domain = reduced;
        const match = lookupDomain(domain, db);
        if (match) {
            return { service: match, normalizedDomain: domain };
        }

        attempts += 1;
    }

    return { service: null, normalizedDomain: domain };
}

function stripWwwPrefix(domain: string): string {
    return domain.startsWith('www.') ? domain.substring(4) : domain;
}

function reduceDomain(domain: string): string | null {
    const parts = domain.split('.');
    if (parts.length <= 2) {
        return null;
    }
    return parts.slice(1).join('.');
}

function lookupDomain(domain: string, db: DatabaseEntry[]): Service | null {
    const match = db.find((entry) => entry.url.split(',').includes(domain));
    return match ? { id: match.id, rating: match.rating } : null;
}
