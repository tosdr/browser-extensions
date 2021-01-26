/* globals browser: true */
/* eslint-disable indent */

const FORCE_DEBUG = false;

function log(...args) { // eslint-disable-line no-unused-vars
    browser.storage.local.get('settings').then((items) => {
        if ((!typeof items.settings === 'undefined' && items.settings.debug) || FORCE_DEBUG) {
            console.log(Object.assign({}, args)); // eslint-disable-line no-console
        }
    });
}
