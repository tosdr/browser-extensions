import { DEFAULT_API_URL } from '../../constants';
import { getLocal } from '../../lib/chromeStorage';

let curatorMode = false;
let apiUrl = DEFAULT_API_URL;

export interface PopupPreferences {
    darkmode: boolean;
    curatorMode: boolean;
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

export async function hydrateState(): Promise<PopupPreferences> {
    const result = await getLocal(['darkmode', 'curatorMode', 'api']);

    const darkmode = Boolean(result['darkmode']);
    const storedCuratorMode = Boolean(result['curatorMode']);
    setCuratorMode(storedCuratorMode);

    const api = result['api'];
    if (typeof api === 'string' && api.length > 0) {
        setApiUrl(api);
    } else {
        setApiUrl(DEFAULT_API_URL);
    }

    return {
        darkmode,
        curatorMode: storedCuratorMode,
    };
}
