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

console.log('inline call to getServices');
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
	console.log('getDomainEntryFromStorage', domain)
	return browser.storage.local.get(REVIEW_PREFIX + domain).then(resultSet => {
		return resultSet[REVIEW_PREFIX + domain];
	});
}

function getServiceDetails(domain) {
	console.log('getServiceDetails', domain)
	if (!domain) {
		return Promise.reject(new Error('no domain name provided'));
	}
	var mainDomain = domain;
	return getDomainEntryFromStorage(domain).then((result) => {
		console.log('result', result);
		if (!result) {
			var domainParts = domain.split('.');
			if (domainParts.length > 2) {
				console.log('trying parent domain')
				return getServiceDetails(domainParts.slice(1).join('.'));
			}
		}
		if (result && result.see) {
			console.log('see', result.see);
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
			mainDomain = result.see;
			return getDomainEntryFromStorage(mainDomain);
		}
		return result;
	}).then((details) => {
		if (details) {
			details.mainDomain = mainDomain; // used as storage key when marking that notification has been displayed
		}
		console.log(details);
		return details;
	});
}

function getService(tab) {
	console.log('getService', tab);
	var domain = getDomain(tab.url);
	return getServiceDetails(domain);
}

function getIconForService(service) {
	var rated = service.rated;
	var imageName = rated ? rated.toLowerCase() : 'false';
	return 'icons/class/' + imageName + '.png';
}


function checkNotification(service) {
	if (service.rated === 'D' || service.rated === 'E') {
		if (service.last) {
			var lastModified = parseInt(Date.parse(service.last));
			log(lastModified);
			var daysSinceLast = (new Date().getTime() - lastModified) / (1000 * 60 * 60 * 24);
			log(daysSinceLast);
	
			if (daysSinceLast <= 7) {
				return;
			}
		}
		service.last = new Date().toDateString();
		var storageKey = service.mainDomain;
		delete service['mainDomain'];
		return browser.storage.local.set({ storageKey: service }).then(() => {
			var notification = browser.notifications.create('tosdr-notify', {
				type: "basic",
				title: service.name,
				message: RATING_TEXT[service.rated],
				iconUrl: './icons/icon@2x.png'
			});
	
			browser.notifications.onClicked.addListener(function(notificationId) {
				browser.notifications.clear(notificationId);
				browser.tabs.create({
					url: 'https://tosdr.org/#' + service.id
				});
			});
		});
	}
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
	console.log('initializePageAction', tab);
	return getService(tab).then((service)=>{
		if (service) {
			browser.pageAction.setIcon({
				tabId: tab.id,
				path: getIconForService(service)
			});
			browser.pageAction.setPopup({
				tabId: tab.id,
				popup: 'popup/popup.html#' + service.id
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

//Run on activating the tab
console.log('setting tab event listeners');
browser.tabs.onActivated.addListener((activeInfo) => {
	console.log('activated', activeInfo);
	browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
		initializePageAction(tabs[0]);
	});
});

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	console.log('updated', changeInfo);
	initializePageAction(tab);
});
