const APPLICABLE_PROTOCOLS = ["http:", "https:"];
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

function createRegExpForServiceUrl(serviceUrl) {
	if (/^http/.exec(serviceUrl)) {
		return serviceUrl + '.*';
	} else {
		return 'https?://[^:/]*\\b' + serviceUrl + '.*';
	}
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function protocolIsApplicable(url) {
	var anchor = document.createElement('a');
	anchor.href = url;
	return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
}

function loadService(serviceName, serviceIndexData) {
	let requestURL = 'https://tosdr.org/services/' + serviceName + '.json';

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


function getServices() {
	const requestURL = "https://tosdr.org/index/services.json";

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

getServices().then((servicesIndex)=>{
	let promiseChain = [];

	for (let serviceName in servicesIndex) {
		promiseChain.push(loadService(serviceName, servicesIndex[serviceName]));
	}

	return Promise.all(promiseChain)
	.then((servicesResponse)=>{
		var setchain = [];

		for (let s of servicesResponse) {
			if (!s.url) {
				continue;
			}
			s.urlRegExp = createRegExpForServiceUrl(s.url);
			s.points = s.points;
			s.class = s.class;
			s.links = s.links;
			if (!s.tosdr) {
				s.tosdr = { rated: false };
			}
			var service = {};
			service[s.id]= s;

			setchain.push(browser.storage.local.set(service));
		}
		return Promise.all(setchain);
	}).then((setchain)=>{
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

function validateURL(service, url){
	return new Promise((resolve, reject) => {
		var re = new RegExp(service.urlRegExp);
		var url_exists = re.test(url);
		if(url_exists){
			resolve(service);
		}else{
			resolve(null);
		}
	});
}

function getService(tab) {
	return browser.storage.local.get().then((services)=>{
		let promiseChain = [];

		for (let serviceName in services) {
			promiseChain.push(validateURL(services[serviceName], tab.url));
		}

		return Promise.all(promiseChain, (service)=>{
			return service;
		}).then((arr)=>{
			arr = arr.filter(function(n){ return n != null }); 
			if(arr.length > 0 ){
				return arr[0];
			}else{
				return null;
			}
		});
	});
}

function getIconForService(service) {
	var rated = false;
	if(service.tosdr !== undefined){
		rated = service.tosdr.rated;
	}
	var imageName = rated ? rated.toLowerCase() : 'false';
	return 'icons/class/' + imageName + '.png';
}


function checkNotification(serviceId) {
	var keys = [
		serviceId,
		'notification/' + serviceId + '/last/update',
		'notification/' + serviceId + '/last/rate'
	];
	return browser.storage.local.get(keys).then(results => {
		var service = results[serviceId];
		var last = results['notification/' + serviceId + '/last/update'];
		var lastRate = 'notification/' + serviceId + '/last/rate'];
		var shouldShow = false;

		if(service.tosdr !== undefined){
			if (!service.tosdr.rated) { return; }
		}

		var rate = service.tosdr.rated;
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
			storage.local.set({
				'notification/' + service.name + '/last/update': new Date().toDateString()),
				localStorage.setItem('notification/' + service.name + '/last/rate': rate
			}).then() => {
				var notification = browser.notifications.create('tosdr-notify', {
					type: "basic",
					title: service.id,
					message: RATING_TEXT[rate],
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

	});
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
	if (protocolIsApplicable(tab.url)) {
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
				checkNotification(service.id);
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
		});

	}
}

//Run on activating the tab
browser.tabs.onActivated.addListener((activeInfo) => {
	browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
		initializePageAction(tabs[0]);
	});
});

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	initializePageAction(tab);
});
