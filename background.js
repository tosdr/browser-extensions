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
	jQuery.ajax('https://tosdr.org/services/' + serviceName + '.json', { 
		success: function (service) {
			if (!service.url) {
				console.log(serviceName+' has no service url');
				return;
			}
			service.urlRegExp = createRegExpForServiceUrl(service.url);
			service.points = serviceIndexData.points;
			service.links = serviceIndexData.links;
			if (!service.tosdr) {
				service.tosdr = { rated: false };
			}
			services.push(service);
			localStorage.setItem(serviceName, JSON.stringify(service));
		}
	});
}


jQuery.ajax('https://tosdr.org/index/services.json', { 
	success: function (servicesIndex) {
		for (var serviceName in servicesIndex) {
			loadService(serviceName, servicesIndex[serviceName]);
		}
	}
});


function getService(tab) {
	var matchingServices = services.filter(function (service) {
		return service.urlRegExp.exec(tab.url);
	});
	return matchingServices.length > 0 ? matchingServices[0] : null;
}

function getIconForService(service) {
	var rated = service.tosdr.rated;
	var imageName = rated ? rated.toLowerCase() : 'false';
	return 'icons/class/' + imageName + '.png';
}


function checkNotification(service) {

	var last = localStorage.getItem('notification/' + service.name + '/last/update');
	var lastRate = localStorage.getItem('notification/' + service.name + '/last/rate');
	var shouldShow = false;

	if (!service.tosdr.rated) { return; }

	var rate = service.tosdr.rated;
	console.log(rate);
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

}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
	if (protocolIsApplicable(tab.url)) {
		var service = getService(tab);
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
		}
	}
}

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	initializePageAction(tab);
});