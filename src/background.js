const APPLICABLE_PROTOCOLS = ["http:", "https:"];
const REVIEW_PREFIX = 'tosdr/review/';
const DEBUG = false;
const RATING_TEXT = {
	"D": "The terms of service are very uneven or there are some important issues that need your attention.",
	"E": "The terms of service raise very serious concerns."
};

var services = [];

/******************* UTILS ****************/
function log(message) {
	if(DEBUG)
		console.log(message);
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function getDomain(url) {
	var anchor = document.createElement('a');
	anchor.href = url;
	if (APPLICABLE_PROTOCOLS.includes(anchor.protocol)) {
		return anchor.hostname
	}
}


function getServices() {
	const requestURL = "https://tosdr.org/api/1/all.json";

	const driveRequest = new Request(requestURL, {
		method: "GET"
	});

	return fetch(driveRequest).then((response) => {
		if (response.status === 200) {
			return response.json();
		} else {
			throw response.status;
		}
	});

}

// In Firefox, we can access browsers.tabs and browser.storage.
// In Chrome, there is no global variable called 'browser', but
// there is one called 'chrome', which has almost the same functions,
// so if 'browser.*' is not defined, use 'chrome.*' instead:
if (typeof browser == 'undefined') {
	browser = {
		tabs: {
			onUpdated: chrome.tabs.onUpdated,
			query: (options) => new Promise(resolve => chrome.tabs.query(options, resolve)),
			create: chrome.tabs.create
		},
		notifications: chrome.notifications,
		storage: {
			local: {
				get: (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
				set: (values) => new Promise(resolve => chrome.storage.local.set(values, resolve))
			}
		},
		pageAction: chrome.pageAction
	}
}
getServices().then((services)=>{
	browser.storage.local.set(services).then(() => {
		/*When first loaded, initialize the page action for all tabs.
		*/
		var gettingAllTabs = browser.tabs.query({});
		return gettingAllTabs.then((tabs) => {
			for (let tab of tabs) {
				//Only active tabs should get the pageAction
				if (tab.active){
					initializePageAction(tab);
				}
			}
		});
	});
});

function getDomainEntryFromStorage(domain) {
	// console.log('getDomainEntryFromStorage', domain)
	return browser.storage.local.get(REVIEW_PREFIX + domain).then(resultSet => {
		return resultSet[REVIEW_PREFIX + domain] || undefined;
	});
}

function getServiceDetails(domain, tries = 0) {
	// console.log('getServiceDetails', domain, tries)
	if (!domain) {
		return Promise.reject(new Error('no domain name provided'));
	}
	if (tries > 10) {
		return Promise.reject(new Error('too many redirections ' + domain));
	}
	return getDomainEntryFromStorage(domain).then((details) => {
		// console.log('details', details);
		if (!details) {
			var domainParts = domain.split('.');
			if (domainParts.length > 2) {
				// console.log('trying parent domain')
				return getServiceDetails(domainParts.slice(1).join('.'), tries + 1);
			} else {
				return Promise.reject(new Error('details not found'));
			}
		}
		if (details.see) {
			// console.log('see', details.see);
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
		details.mainDomain = domain; // used as storage key when marking that notification has been displayed
		// console.log('mainDomain set', details);
		return details;
	});
}

function getService(tab) {
	// console.log('getService', tab);
	var domain = getDomain(tab.url);
	return getServiceDetails(domain);
}

function getIconForService(service) {
	var rated = service.rated;
	var imageName = rated ? rated.toLowerCase() : 'false';
	return 'icons/class/' + imageName + '.png';
}

function checkNotification(service) {
	// console.log('checkNotification', service);
	var last = localStorage.getItem('notification/' + service.name + '/last/update');
	var lastRate = localStorage.getItem('notification/' + service.name + '/last/rate');
	var shouldShow = false;

	if (!service.rated) { return; }

	var rate = service.rated;
	if (rate === 'D' || rate === 'E') {

		if (last) {
			var lastModified = parseInt(Date.parse(last));
			log(lastModified);
			var daysSinceLast = (new Date().getTime() - lastModified) / (1000 * 60 * 60 * 24);
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
		localStorage.setItem('notification/' + service.name + '/last/update', new Date().toDateString());
		localStorage.setItem('notification/' + service.name + '/last/rate', rate);

		var notification = browser.notifications.create('tosdr-notify', {
			type: "basic",
			title: service.name,
			message: RATING_TEXT[rate],
			iconUrl: './icons/icon@2x.png'
		});

		browser.notifications.onClicked.addListener(function(notificationId) {
			browser.notifications.clear(notificationId);
			browser.tabs.create({
				url: 'https://tosdr.org/#' + service.slug
			});
		});
	}
	
	
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
	// console.log('initializePageAction', tab);
	return getService(tab).then((service)=>{
		// console.log('got service', service);
		if (service) {
			browser.pageAction.setIcon({
				tabId: tab.id,
				path: getIconForService(service)
			});
			browser.pageAction.setPopup({
				tabId: tab.id,
				popup: 'popup/popup.html#' + service.slug
			})
			browser.pageAction.show(tab.id);
			checkNotification(service);
		}else{
			browser.pageAction.setIcon({
				tabId: tab.id,
				path: 'icons/class/none.png'
			});
			browser.pageAction.setPopup({
				tabId: tab.id,
				popup: 'popup/popup.html#none'
			})
			browser.pageAction.show(tab.id);
		}
	}).catch(err => {
        	if (err.message = 'no domain name provided') {
			return;
		}
		console.error(err);
	});
}

//Run when loading the tab completes
// console.log('setting tab event listeners');
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	// console.log('updated', id, changeInfo, tab);
	if (changeInfo.status == 'complete') {
		initializePageAction(tab);
	}
});
