/* globals document, browser: true, chrome, fetch, Request */
/* eslint-disable indent */
const APPLICABLE_PROTOCOLS = ['http:', 'https:']; // eslint-disable-line no-unused-vars
const REVIEW_PREFIX = 'tosdr/review/'; // eslint-disable-line no-unused-vars
const DEBUG = true;
const RATING_TEXT = { // eslint-disable-line no-unused-vars
    D: 'The terms of service are very uneven or there are some important issues that need your attention.',
    E: 'The terms of service raise very serious concerns.',
};

const services = []; // eslint-disable-line no-unused-vars

/** ***************** UTILS *************** */
function log(message) { // eslint-disable-line no-unused-vars
    if (DEBUG) {
        console.log(message); // eslint-disable-line no-console
    }
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function getDomain(url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    if (APPLICABLE_PROTOCOLS.includes(anchor.protocol)) {
        if (anchor.hostname.startsWith('www.')) {
            return anchor.hostname.substr(4);
        }
        return anchor.hostname;
    }
    return null;
}

function getServices() { // eslint-disable-line no-unused-vars
    const requestURL = 'https://beta.tosdr.org/api/1/all.json';

    const driveRequest = new Request(requestURL, {
        method: 'GET',
    });

    return fetch(driveRequest).then((response) => {
        if (response.status === 200) {
            return response.json();
        }
        throw response.status;
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
        storage: {
            local: {
                get: keys => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
                set: values => new Promise(resolve => chrome.storage.local.set(values, resolve)),
            },
        },
        pageAction: chrome.pageAction,
    };
}

function getDomainEntryFromStorage(domain) {
    // console.log('getDomainEntryFromStorage', domain)
    return browser.storage.local.get(REVIEW_PREFIX + domain)
        .then(resultSet => resultSet[REVIEW_PREFIX + domain] || undefined);
}

function getLiveServiceDetails(domain, tries = 0) { // eslint-disable-line no-unused-vars
    // console.log('getServiceDetails', domain, tries)
    if (!domain) {
        return Promise.reject(new Error('no domain name provided'));
    }
    if (tries > 10) {
        return Promise.reject(new Error(`too many redirections ${domain}`));
    }

    return getDomainEntryFromStorage(domain).then((details) => {
        const requestURL = `https://beta.tosdr.org/api/1/${details.slug}.json`;

        const driveRequest = new Request(requestURL, {
            method: 'GET',
        });

        return fetch(driveRequest).then((response) => {
            if (response.status === 200) {
                return response.json().then(data => Object.assign({ mainDomain: domain }, data));
            }
            throw response.status;
        });
    });
}
function getServiceDetails(domain, tries = 0) {
    // console.log('getServiceDetails', domain, tries)
    if (!domain) {
        return Promise.reject(new Error('no domain name provided'));
    }
    if (tries > 10) {
        return Promise.reject(new Error(`too many redirections ${domain}`));
    }

    return getDomainEntryFromStorage(domain).then((details) => {
        // console.log('details', details)
        if (!details) {
            const domainParts = domain.split('.');
            if (domainParts.length > 2) {
                // console.log('trying parent domain')
                return getServiceDetails(domainParts.slice(1).join('.'), tries + 1);
            }
            return Promise.reject(new Error('details not found'));
        }
        if (details.see) {
            return getServiceDetails(details.see, tries + 1);
        }
        // console.log('mainDomain set', details)
        return Object.assign({
            mainDomain: domain,
        }, details);
    });
}

function getService(tab) { // eslint-disable-line no-unused-vars
    // console.log('getService', tab)
    const domain = getDomain(tab.url);
    return getServiceDetails(domain);
}

function getIconForService(service) { // eslint-disable-line no-unused-vars
    const imageName = service.rated ? service.rated.toLowerCase() : 'false';
    return `icons/class/${imageName}.png`;
}
