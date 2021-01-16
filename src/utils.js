/* globals browser: true, chrome:true */
/* eslint-disable indent */

const FORCE_DEBUG = true;

function log(...args) { // eslint-disable-line no-unused-vars
    browser.storage.local.get('settings').then((items) => {
        if ((!typeof items.settings === 'undefined' && items.settings.debug) || FORCE_DEBUG) {
            console.log(Object.assign({}, args)); // eslint-disable-line no-console
        }
    });
}

// In Firefox, we can access browsers.tabs and browser.storage.
// In Chrome, there is no global variable called 'browser', but
// there is one called 'chrome', which has almost the same functions,
// so if 'browser.*' is not defined, use 'chrome.*' instead:
if (typeof browser === 'undefined') {
    browser = {
        tabs: {
            onUpdated: chrome.tabs.onUpdated,
            query: options => new Promise(resolve => chrome.tabs.query(options, resolve)),
            create: chrome.tabs.create,
        },
        notifications: chrome.notifications,
        runtime: chrome.runtime,
        storage: {
            local: {
                get: keys => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
                set: values => new Promise(resolve => chrome.storage.local.set(values, resolve)),
                clear: values => new Promise(resolve => chrome.storage.local.clear(values, resolve)), // eslint-disable-line max-len
            },
        },
        pageAction: chrome.pageAction,
    };
}
