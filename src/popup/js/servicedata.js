/* globals document, browser: true, fetch, Request, log */
/* eslint-disable indent, max-len */
const APPLICABLE_PROTOCOLS = ['http:', 'https:']; // eslint-disable-line no-unused-vars
const REVIEW_PREFIX = 'tosdr/review/'; // eslint-disable-line no-unused-vars
const RATING_TEXT = { // eslint-disable-line no-unused-vars
    D: 'The terms of service are very uneven or there are some important issues that need your attention.',
    E: 'The terms of service raise very serious concerns.',
};

const FALLBACK_API = 'https://tosdr.org/api/v1/service/'; // eslint-disable-line no-unused-vars
const FALLBACK_SHIELDS = 'https://tosdr.org/api/badge/service/'; // eslint-disable-line no-unused-vars
const FALLBACK_UPDATE_API = 'https://tosdr.org/api/updatecheck/';
const services = []; // eslint-disable-line no-unused-vars

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

function getRatingText(label) { // eslint-disable-line no-unused-vars
    let text = String;
    switch (label) {
        case 'A':
            text = 'The terms of service treat you fairly, respect your rights and follow the best practices.';
            break;
        case 'B':
            text = 'The terms of services are fair towards the user but they could be improved.';
            break;
        case 'C':
            text = 'The terms of service are okay but some issues need your consideration.';
            break;
        case 'D':
            text = 'The terms of service are very uneven or there are some important issues that need your attention.';
            break;
        case 'E':
            text = 'The terms of service raise very serious concerns.';
            break;
        default:
            text = 'We haven\'t sufficiently reviewed the terms yet. Please contribute to on Phoenix: edit.tosdr.org';
    }

    return text;
}

function getTweetText(service) { // eslint-disable-line no-unused-vars
    let text = String;
    switch (service.class) {
        case 'A':
            text = `Thank you ${service.name} for caring about my privacy! Grade ${service.class}!`;
            break;
        case 'B':
            text = `Thank you ${service.name} for caring about my privacy! Grade ${service.class} is good but it could be improved!`;
            break;
        case 'C':
            text = `${service.name}, your Grade ${service.class} is not that good, can you comment?`;
            break;
        case 'D':
        case 'E':
            text = `Your Grade ${service.class} rating worries me ${service.name}, can you comment?`;
            break;
        default:
            return false;
    }

    return text;
}

function compareVersion(version = null) { // eslint-disable-line no-unused-vars
    let _version = version; // eslint-disable-line no-underscore-dangle
    if (version === null) {
        _version = browser.runtime.getManifest().version;
    }
    return browser.storage.local.get('settings').then((items) => {
        const requestURL = `${(typeof items.settings === 'undefined' ? FALLBACK_UPDATE_API : items.settings.update_api_endpoint)}${_version}.json`;
        const driveRequest = new Request(requestURL, {
            method: 'GET',
        });

        return fetch(driveRequest).then((response) => {
            if (response.status === 200) {
                return response.json();
            }
            throw response.status;
        });
    });
}

function getServices() { // eslint-disable-line no-unused-vars
    return browser.storage.local.get('settings').then((items) => {
        const requestURL = `${(typeof items.settings === 'undefined' ? FALLBACK_API : items.settings.api_endpoint)}/all.json`;
        const driveRequest = new Request(requestURL, {
            method: 'GET',
        });

        return fetch(driveRequest).then((response) => {
            if (response.status === 200) {
                return response.json();
            }
            throw response.status;
        });
    });
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

    return getDomainEntryFromStorage(domain).then(details => browser.storage.local.get('settings').then((items) => {
        const requestURL = `${(typeof items.settings === 'undefined' ? FALLBACK_API : items.settings.api_endpoint)}/${details.id}.json`;
        const driveRequest = new Request(requestURL, {
            method: 'GET',
        });

        return fetch(driveRequest).then((response) => {
            if (response.status === 200) {
                return response.json().then(data => Object.assign({ mainDomain: domain }, data));
            }
            throw response.status;
        });
    }));
}

function getServiceDetails(domain, tries = 0) {
    log('getServiceDetails', domain, tries);
    if (!domain) {
        return Promise.reject(new Error('no domain name provided'));
    }
    if (tries > 10) {
        return Promise.reject(new Error(`too many redirections ${domain}`));
    }

    return getDomainEntryFromStorage(domain).then((details) => {
        if (!details) {
            const domainParts = domain.split('.');
            if (domainParts.length > 2) {
                log('trying parent domain');
                return getServiceDetails(domainParts.slice(1).join('.'), tries + 1);
            }
            log('details of domain not found', domain);
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
