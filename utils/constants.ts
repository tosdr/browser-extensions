export const DEFAULT_API_URL = 'api.tosdr.org';

export const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

export const MAX_DOMAIN_REDUCTIONS = 4;

export const DONATION_BADGE_TEXT = '!';

export const DEFAULT_UPDATE_INTERVAL_DAYS = 7;

export const DB_CHECK_ALARM = 'tosdr-db-check';
export const DB_CHECK_PERIOD_MINUTES = 60;

export const API_HEADERS = {
    apikey: atob('Y29uZ3JhdHMgb24gZ2V0dGluZyB0aGUga2V5IDpQ'),
};

export const SUPPORTED_LANGUAGES = ['en', 'de', 'nl', 'fr', 'es'] as const;

export const GRADES = ['A', 'B', 'C', 'D', 'E'] as const;

export const LINKS = {
    tosdr: 'https://tosdr.org/',
    service: (id: string | number) => `https://tosdr.org/en/service/${id}`,
    phoenix: 'https://edit.tosdr.org',
    phoenixService: (id: string | number) =>
        `https://edit.tosdr.org/services/${id}`,
    donate: 'https://tosdr.org/en/sites/donate',
    source: 'https://github.com/tosdr/browser-extensions',
    logo: (id: string | number) => `https://s3.tosdr.org/logos/${id}.png`,
};
