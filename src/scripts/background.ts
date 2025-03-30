// import * as Sentry from '@sentry/browser';

interface DatabaseEntry {
    id: string;
    url: string;
    rating: string;
}

interface Service {
    id: string;
    rating: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

var apiUrl = 'api.tosdr.org';

// let sentry = false;

function getBrowserEnviroment() {
    return `User Agent: ${navigator.userAgent}\nPlatform: ${navigator.platform}\nLanguage: ${navigator.language}`;
}

function setPopup(tabId: number | null, popup: string): void {
    if (!tabId) {
        console.log('tabid is undefined, goodbye');
        // Sentry.captureException(`tabid is undefined! - ${popup}`);
        return;
    }
    chrome.action.setPopup({
        tabId,
        popup,
    });
}

function serviceDetected(tab: chrome.tabs.Tab, service: Service): void {
    setTabIcon(tab, service.rating.toLowerCase());

    setPopup(tab?.id ?? null, `/views/popup.html?service-id=${service.id}`);
    setTabBadgeNotification(false, tab);
}

function initializePageAction(tab: chrome.tabs.Tab): void {
    if (!tab || !tab.url) {
        console.log('tab is undefined');
        setPopup(null, '/views/popup.html');
        setTabIcon(tab, 'logo');
        setTabBadgeNotification(true, tab);
        return;
    }
    const url = new URL(tab.url);
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
        // we only want to check http and https
        setPopup(tab?.id ?? null, '/views/popup.html');
        setTabIcon(tab, 'logo');
        setTabBadgeNotification(true, tab);
        return;
    }

    if (tab.url == '') {
        setPopup(tab?.id ?? null, '/views/popup.html');
        setTabIcon(tab, 'logo');
        setTabBadgeNotification(true, tab);
        return;
    }

    // change icon to icons/loading.png
    setTabIcon(tab, 'loading');
    setTabBadgeNotification(false, tab);

    // get database from chrome.storage
    chrome.storage.local.get(['db'], function (result) {
        if (result.db) {
            // parse the database
            const db = result.db as DatabaseEntry[];

            var domain = url.hostname;

            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }

            console.log(domain);

            var domainEntry = db.filter((entry) =>
                entry.url.split(',').includes(domain)
            );
            if (domainEntry.length === 1) {
                console.log('exact match!');
                serviceDetected(tab, domainEntry[0]);
                return;
            } else {
                const maxTries = 4;
                var current = 0;

                while (current < maxTries) {
                    const domainParts = domain.split('.');
                    if (domainParts.length > 2) {
                        domain = domainParts.slice(1).join('.');
                        console.log(`try ${current}: ${domain}`);
                        domainEntry = db.filter((entry) =>
                            entry.url.split(',').includes(domain)
                        );
                        if (domainEntry.length === 1) {
                            console.log('exact match!');
                            current = maxTries + 1;
                            serviceDetected(tab, domainEntry[0]);
                            return;
                        }
                    } else {
                        break;
                    }
                    current++;
                }
            }

            // we didnt find the domain in the database try parent else show notfound.png
            setPopup(tab?.id ?? null, `/views/popup.html?url=${domain}`);
            setTabIcon(tab, 'notfound');
        } else {
            // database is not in chrome.storage, download it
            console.log('Database is not in chrome.storage');
            downloadDatabase().then(() => {
                initializePageAction(tab);
            });
        }
    });
}

const handleRuntimeError = () => {
    const error = chrome.runtime.lastError?.message;
    if (error) {
        // if (sentry) Sentry.captureException(error);
        throw new Error(error);
    }
};

function setTabIcon(tab: chrome.tabs.Tab | null, icon: string): void {
    const iconDetails: chrome.action.TabIconDetails = {
        path: {
            32: `/icons/${icon}/${icon}32.png`,
            48: `/icons/${icon}/${icon}48.png`,
            128: `/icons/${icon}/${icon}128.png`,
        },
    };

    if (tab) {
        iconDetails.tabId = tab.id;
    }

    chrome.action.setIcon(iconDetails);
}

async function setTabBadgeNotification(on: boolean, tab: chrome.tabs.Tab): Promise<void> {
    // Retrieve the value from storage and ensure it's a boolean
    const data = await chrome.storage.local.get('displayDonationReminder');
    const dDR = Boolean(data.displayDonationReminder?.active);

    if (on && dDR) {
        chrome.action.setBadgeText({ text: '!', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: 'red' });
    } else {
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
}

async function downloadDatabase() {
    // get the database directly from the new endpoint
    const db_url = `https://${apiUrl}/appdb/version/v2`;
    const response = await fetch(db_url, {
        headers: {
            apikey: atob('Y29uZ3JhdHMgb24gZ2V0dGluZyB0aGUga2V5IDpQ'),
        },
    });

    if (response.status >= 300) {
        chrome.action.setBadgeText({ text: 'err ' + response.status });
        return;
    }

    const data = await response.json();

    chrome.storage.local.set(
        {
            db: data,
            lastModified: new Date().toISOString(),
        },
        function () {
            console.log('Database downloaded and saved to chrome.storage');
        }
    );
}

chrome.action.setBadgeText({ text: '' });
//check if its time to show a donation reminder
async function checkDonationReminder() {
    // Retrieve the value from storage and ensure it's a boolean
    const data = await chrome.storage.local.get('displayDonationReminder');
    const dDR = Boolean(data.displayDonationReminder?.active);
    if (
        dDR !== true &&
        data.displayDonationReminder.allowedPlattform === true
    ) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        try {
            const result: any = await chrome.storage.local.get(
                'lastDismissedReminder'
            );
            const lastDismissedReminder = result.lastDismissedReminder;
            const lastDismissedYear = lastDismissedReminder?.year;
            console.log(lastDismissedYear);

            if (
                currentYear > lastDismissedYear ||
                lastDismissedYear === undefined
            ) {
                chrome.action.setBadgeText({ text: '!' });
                chrome.storage.local.set({
                    displayDonationReminder: {
                        active: true,
                        allowedPlattform:
                            data.displayDonationReminder.allowedPlattform,
                    },
                });
            }
        } catch (error) {}
    } else {
        chrome.action.setBadgeText({ text: '!' });
    }
}

function checkIfUpdateNeeded(firstStart = false) {
    chrome.storage.local.get(
        ['db', 'lastModified', 'interval', 'api', 'sentry'],
        function (result) {
            // if (result.sentry) {
            //     sentry = result.sentry;
            //     Sentry.init({
            //         dsn: 'https://07c0ebcab5894cff990fd0d3871590f0@sentry.internal.jrbit.de/38',
            //     });
            // }
            if (result.api) {
                if (result.api.length !== 0) apiUrl = result.api;
            }

            if (result.db && result.lastModified) {
                var interval = 8;
                if (result.interval) {
                    interval = result.interval;
                    interval++;
                }
                // check if the database is less than 7 days old
                const lastModified = new Date(result.lastModified);
                const today = new Date();
                const diffTime = Math.abs(
                    today.getTime() - lastModified.getTime()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < interval) {
                    console.log(
                        `Database is less than ${
                            interval - 1
                        } days old, skipping download`
                    );
                    return;
                }
            }
            downloadDatabase().then(() => {
                if (firstStart) {
                    chrome.runtime.openOptionsPage();
                }
            });
        }
    );
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        initializePageAction(tab);
    }
});

chrome.tabs.onCreated.addListener(function (tab) {
    initializePageAction(tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        initializePageAction(tab);
    });
});

chrome.runtime.onInstalled.addListener(function () {
    const userAgent = navigator.userAgent;
    let donationReminderAllowed: boolean;
    if (userAgent.indexOf('Mac') != -1 && userAgent.indexOf('Safari') != -1) {
        console.log('MacOS and Safari detected' + userAgent);
        donationReminderAllowed = false;
    } else {
        console.log('MacOS and Safari NOT detected' + userAgent);
        donationReminderAllowed = true;
    }

    chrome.storage.local.set(
        {
            themeHeader: true,
            sentry: false,
            displayDonationReminder: {
                active: false,
                allowedPlattform: donationReminderAllowed,
            },
        },
        function () {
            console.log('enabled theme header by default');
            checkIfUpdateNeeded(true);
            chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                    initializePageAction(tabs[0]);
                }
            );
        }
    );
});

chrome.runtime.onStartup.addListener(function () {
    checkIfUpdateNeeded();
});
checkDonationReminder();
