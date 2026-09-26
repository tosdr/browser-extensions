import { useCallback, useEffect, useState } from 'react';
import type { WxtStorageItem } from '#imports';
import { applyTheme } from './theme';

export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
    const [value, setValueState] = useState<T>(item.fallback);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void item.getValue().then((v) => {
            if (!cancelled) {
                setValueState(v);
                setLoaded(true);
            }
        });
        const unwatch = item.watch((v) => setValueState(v));
        return () => {
            cancelled = true;
            unwatch();
        };
    }, [item]);

    const setValue = useCallback(
        (next: T) => {
            setValueState(next);
            void item.setValue(next);
        },
        [item]
    );

    return [value, setValue, loaded] as const;
}

export function useTheme(darkmode: boolean | null): void {
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => applyTheme(darkmode);
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [darkmode]);
}
