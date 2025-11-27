import { DEFAULT_API_URL} from '../../constants';
import { getLocal } from '../../lib/chromeStorage';
import {
    SupportedLanguage,
    resolveLanguage,
} from '../../lib/language';

let curatorMode = false;
let apiUrl = DEFAULT_API_URL;
let language: SupportedLanguage = 'en';
let pointListStyle:"docCategories" | "unified" = "unified"

export interface PopupPreferences {
    darkmode: boolean;
    curatorMode: boolean;
    language: SupportedLanguage;
    pointListStyle:"docCategories" | "unified"
}

export function isCuratorMode(): boolean {
    return curatorMode;
}

export function setCuratorMode(value: boolean): void {
    curatorMode = value;
}

export function getApiUrl(): string {
    return apiUrl;
}

export function setApiUrl(url: string): void {
    apiUrl = url;
}

export function getPointListStyle() {
    return pointListStyle
}

export async function hydrateState(): Promise<PopupPreferences> {
    const result = await getLocal(['darkmode', 'curatorMode', 'api', 'language', 'pointListStyle']);

    const darkmode = Boolean(result['darkmode']);
    const storedCuratorMode = Boolean(result['curatorMode']);
    pointListStyle = result['pointListStyle'] as "docCategories" | "unified"
    setCuratorMode(storedCuratorMode);

    const api = result['api'];
    if (typeof api === 'string' && api.length > 0) {
        setApiUrl(api);
    } else {
        setApiUrl(DEFAULT_API_URL);
    }

    const resolvedLanguage = resolveLanguage(result['language']);
    setLanguage(resolvedLanguage);

    return {
        darkmode,
        curatorMode: storedCuratorMode,
        language: resolvedLanguage,
        pointListStyle,
    };
}

export function getLanguage(): SupportedLanguage {
    return language;
}

export function setLanguage(value: SupportedLanguage): void {
    language = value;
}
