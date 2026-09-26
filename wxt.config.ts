import { defineConfig } from 'wxt';

export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifestVersion: 3,
    manifest: ({ browser }) => ({
        name: '__MSG_extensionName__',
        description: '__MSG_extensionDescription__',
        default_locale: 'en',
        homepage_url: 'https://tosdr.org',
        permissions: ['tabs', 'storage', 'alarms'],
        action: {
            default_icon: {
                16: 'icons/logo/logo16.png',
                32: 'icons/logo/logo32.png',
                48: 'icons/logo/logo48.png',
                128: 'icons/logo/logo128.png',
            },
        },
        ...(browser === 'firefox' && {
            browser_specific_settings: {
                gecko: { id: 'testing@tosdr' },
            },
        }),
    }),
});
