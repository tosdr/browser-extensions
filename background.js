const APPLICABLE_PROTOCOLS = ["http:", "https:"];
const RATING_TEXT = {
	"D": "The terms of service are very uneven or there are some important issues that need your attention.",
	"E": "The terms of service raise very serious concerns."
};

var services = [];

/******************* UTILS ****************/
function log(message) {
	console.log(message);
}

function createRegExpForServiceUrl(serviceUrl) {
	if (/^http/.exec(serviceUrl)) {
		return new RegExp(serviceUrl + '.*');
	} else {
		return new RegExp('https?://[^:/]*\\b' + serviceUrl + '.*');
	}
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function protocolIsApplicable(url) {
	var anchor =  document.createElement('a');
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
	
	for (var serviceName in servicesIndex) {
		promiseChain.push(loadService(serviceName, servicesIndex[serviceName]));
	}
	
	return Promise.all(promiseChain)
	.then((servicesResponse)=>{
		var setchain = [];
		
		for (var i = 0; i < servicesResponse.length; i++) {
			if (!servicesResponse[i].url) {
				continue;
			}
			servicesResponse[i].urlRegExp = createRegExpForServiceUrl(servicesResponse[i].url);
			servicesResponse[i].points = servicesResponse[i].points;
			servicesResponse[i].class = servicesResponse[i].class;
			servicesResponse[i].links = servicesResponse[i].links;
			if (!servicesResponse[i].tosdr) {
				servicesResponse[i].tosdr = { rated: false };
			}
			var service = {};
			service[servicesResponse[i].id]= servicesResponse[i];

			setchain.push(browser.storage.local.set(service));
		}
		return Promise.all(setchain);
	}).then((setchain)=>{
		/*When first loaded, initialize the page action for all tabs.
		*/
		var gettingAllTabs = browser.tabs.query({});
		return gettingAllTabs.then((tabs) => {
			for (let tab of tabs) {
				initializePageAction(tab);
			}
		});
	});
});

function getService(tab) {
	return browser.storage.local.get().then((services)=>{
		var matchingServices = Object.keys(services).filter(function (service) {
			return services[service].urlRegExp.exec(tab.url);
		});

		return matchingServices.length > 0 ? services[matchingServices[0]] : null;
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


function checkNotification(ser) {

	return browser.storage.local.get(ser.name).then((service)=>{
		var service = service[ser.name];
		var last = localStorage.getItem('notification/' + service.name + '/last/update');
		var lastRate = localStorage.getItem('notification/' + service.name + '/last/rate');
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
			localStorage.setItem('notification/' + service.name + '/last/update', new Date().toDateString());
			localStorage.setItem('notification/' + service.name + '/last/rate', rate);

			var opt = {
				type: "basic",
				title: service.id,
				message: RATING_TEXT[rate],
				iconUrl: './images/icon-128.png'
			}

			var notification = browser.notifications.create('tosdr-notify', opt, function(event){
				console.log(event)
			});

			browser.notifications.onButtonClicked.addListener(function(){
				browser.tabs.create({
					url: 'https://tosdr.org/#' + service.id
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
		});
		
	}
}

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	initializePageAction(tab);
});