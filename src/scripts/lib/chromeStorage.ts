export async function getLocal<T extends string | string[]>(
    keys: T
): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
            resolve(result as Record<string, unknown>);
        });
    });
}

export async function setLocal(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
            resolve();
        });
    });
}
