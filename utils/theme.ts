import { darkmodeItem } from './storage';

export function applyTheme(darkmode: boolean | null): void {
    const dark = darkmode ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export async function applyStoredTheme(): Promise<void> {
    applyTheme(await darkmodeItem.getValue());
}
