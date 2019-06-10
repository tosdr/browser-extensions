/* globals document, browser: true, chrome, fetch, Request, RATING_TEXT */

const APPLICABLE_PROTOCOLS = ['http:', 'https:']; // eslint-disable-line no-unused-vars
const REVIEW_PREFIX = 'tosdr/review/'; // eslint-disable-line no-unused-vars
const DEBUG = false;

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
    return anchor.hostname;
  }
  return null;
}

function getServices() { // eslint-disable-line no-unused-vars
  const requestURL = 'https://tosdr.org/api/1/all.json';

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
      // console.log('see', details.see)
      // with the '.see' field, this domain entry can redirect us to a service's main domain, e.g.
      // > ...
      // > 'google.fr': {
      // >   see: 'google.com'
      // > },
      // > ...
      // > 'google.com': {
      // >   rated: 'C',
      // >   points: [
      // >   ... details you want
      // > }
      // > ...
      return getServiceDetails(details.see, tries + 1);
    }
    // console.log('mainDomain set', details)
    return Object.assign({
      mainDomain: domain, // used as storage key when marking that notification has been displayed
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
