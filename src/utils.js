/* globals  browser */
/* eslint-disable indent */

const FORCE_DEBUG = true;

function log(...args) { // eslint-disable-line no-unused-vars
    browser.storage.local.get('settings').then((items) => {
        if (items.settings.debug || FORCE_DEBUG) {
            console.log(Object.assign({}, args)); // eslint-disable-line no-console
        }
    });
}
