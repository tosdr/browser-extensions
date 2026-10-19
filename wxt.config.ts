import { defineConfig } from 'wxt';
import type { Plugin } from 'vite';

function stripReactInnerHTML(): Plugin {
    const assignment = '(domElement.innerHTML = key);';
    const replacement =
        '(() => { throw Error("dangerouslySetInnerHTML is not supported"); })();';

    return {
        name: 'strip-react-innerhtml',
        enforce: 'pre',
        transform(code, id) {
            if (!/react-dom[\\/]cjs[\\/]react-dom-client\.(production|development)\.js$/.test(id)) {
                return null;
            }
            const count = code.split(assignment).length - 1;
            if (count !== 2) {
                this.error(
                    `Expected 2 innerHTML assignments in ${id}, found ${count}. ` +
                        'react-dom changed; update stripReactInnerHTML in wxt.config.ts.'
                );
            }
            return { code: code.replaceAll(assignment, replacement), map: null };
        },
    };
}

export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifestVersion: 3,
    vite: () => ({
        plugins: [stripReactInnerHTML()],
    }),
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
                gecko: {
                    id: 'jid0-3GUEt1r69sQNSrca5p8kx9Ezc3U@jetpack',
                    data_collection_permissions: {
                        required: ['browsingActivity'],
                    },
                },
            },
        }),
    }),
});
