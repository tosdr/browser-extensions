/* global browser, localStorage, log, RATING_TEXT, getServices, getService, getIconForService */
/* global getDomain */
/* requires ./popup/js/servicedata.js */
/* eslint-disable indent, max-len */

function checkNotification(service) {
    browser.storage.local.get('settings').then((items) => {
        if (items.settings.notifications) {
            const last = localStorage.getItem(`notification/${service.id}/last/update`);
            const lastRate = localStorage.getItem(`notification/${service.id}/last/rate`);
            let shouldShow = false;

            if (!service.rated) { return; }

            const rate = service.rated;
            if (rate === 'D' || rate === 'E') {
                if (last) {
                    const lastModified = parseInt(Date.parse(last), 10);
                    log(lastModified);
                    const daysSinceLast = (new Date().getTime() - lastModified) / (1000 * 60 * 60 * 24);
                    log(daysSinceLast);

                    if (daysSinceLast > 7) {
                        shouldShow = true;
                    }
                } else {
                    shouldShow = true;
                }
            } else if (lastRate === 'D' || lastRate === 'E') {
                shouldShow = true;
            }

            if (shouldShow) {
                localStorage.setItem(`notification/${service.id}/last/update`, new Date().toDateString());
                localStorage.setItem(`notification/${service.id}/last/rate`, rate);

                browser.notifications.create('tosdr-notify', {
                    type: 'basic',
                    title: service.name,
                    message: RATING_TEXT[rate],
                    iconUrl: './icons/icon@2x.png',
                });

                browser.notifications.onClicked.addListener((notificationId) => {
                    browser.notifications.clear(notificationId);
                    browser.tabs.create({
                        url: `https://tosdr.org/en/service/${service.id}`,
                    });
                });

                browser.notifications.onClosed.addListener((notificationId) => {
                    browser.notifications.clear(notificationId);
                });
            }
        }
    });
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
    // console.log('initializePageAction', tab);
    return getService(tab).then((service) => {
        // console.log('got service', service);
        if (service) {
            browser.pageAction.setIcon({
                tabId: tab.id,
                path: getIconForService(service),
            });
            browser.pageAction.setPopup({
                tabId: tab.id,
                popup: `popup/popup.html#${service.mainDomain}`,
            });
            browser.pageAction.show(tab.id);
            checkNotification(service);
        } else {
            browser.pageAction.setIcon({
                tabId: tab.id,
                path: 'icons/class/none.png',
            });
            browser.pageAction.setPopup({
                tabId: tab.id,
                popup: `popup/popup.html#${getDomain(tab.url)}`,
            });
            browser.pageAction.show(tab.id);
        }
    }).catch((err) => {
        if (err.message === 'no domain name provided') {
            return;
        }
        if (err.message === 'details not found') {
            browser.pageAction.setIcon({
                tabId: tab.id,
                path: 'icons/class/none.png',
            });
            browser.pageAction.setPopup({
                tabId: tab.id,
                popup: `popup/popup.html#${getDomain(tab.url)}`,
            });
            browser.pageAction.show(tab.id);
        }
    });
}

getServices().then((services) => {
    log(services);
    browser.storage.local.set(services).then(() => {
        log('initialized');
        const gettingAllTabs = browser.tabs.query({});
        return gettingAllTabs.then((tabs) => {
            tabs.forEach((t) => {
                // Only active tabs should get the pageAction
                if (t.active) {
                    initializePageAction(t);
                }
            });
        });
    });
});

// Run when loading the tab completes
// console.log('setting tab event listeners');
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    // console.log('updated', id, changeInfo, tab);
    if (changeInfo.status === 'complete') {
        initializePageAction(tab);
    }
});

browser.runtime.onInstalled.addListener((details) => {
    if (typeof details !== 'undefined' && (details.reason === 'install' || details.reason === 'update')) {
        browser.runtime.openOptionsPage();
    }
});
