export const DEFAULT_API_URL = 'api.tosdr.org';

export const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

export const MAX_DOMAIN_REDUCTIONS = 4;

export const DONATION_BADGE_TEXT = '!';

export const DEFAULT_POPUP_PATH = '/views/popup.html';

export const API_HEADERS = {
    apikey: atob('Y29uZ3JhdHMgb24gZ2V0dGluZyB0aGUga2V5IDpQ'),
};

export const SUPPORTED_LANGUAGES = ['en', 'de', 'nl', 'fr', 'es'] as const;

export const DEFAULT_LIST_STYLE :"docCategories" | "unified" = "docCategories" as const;
