/*!
* TOS-checker addon for firefox 0.4 Beta
* Abdullah Diaa / @AbdullahDiaa
*
* Copyright 2012
* MPL 1.1/GPL 2.0/LGPL 2.1
*
* Date: 04 Oct. 2014
*/
/*global require: false, exports: false */
/*jslint indent: 2 */


"use strict";
const	tabs = require("sdk/tabs"),
		{ UrlbarButton } = require("urlbarbutton"),
		{ data } = require("sdk/self"),
		ss = require("sdk/simple-storage"),
		Request = require("sdk/request").Request,
		notifications = require("sdk/notifications"),
		ratingClasses = ['none', 'B' , 'C', 'D', 'E'];
		
		
const debug = true;

var TosdrMediator = require("./tosdr_mediator").tosdrMediator;
var tosdrMediator = new TosdrMediator();
		
var		checkLocation,
		button,
		prefs = require("sdk/simple-prefs").prefs,
		RATING_TEXT = {
		    "D": "The terms of service are very uneven or there are some important issues that need your attention.",
		    "E": "The terms of service raise very serious concerns."
		};
		
// Tsodr Logger
function log(aMessage) {
  if (debug)
  	 console.log("tosdr: " + aMessage);
}

exports.main = function(options, callbacks) {
	
	log("tosdr loaded");

	// create storage for services locally
	if (!ss.storage.services)
		ss.storage.services = {};

	if(ss.storage.lastServicesUpdate){
		var daysSinceLastServicesUpdate = Math.ceil(Math.abs(new Date().getTime() - ss.storage.lastServicesUpdate) / (1000 * 3600 * 24));
		log("Services data updated " + daysSinceLastServicesUpdate + " day/s ago.");
		if(daysSinceLastServicesUpdate > 13){
			//Request services and store locally
			tosdrMediator.fetchAllServices(function(services) {
				for (var serviceName in services) {
					getService(serviceName, services[serviceName]);
				}
				ss.storage.lastServicesUpdate = new Date().getTime();
			});
		}
	}else{
		//Request services and store locally
		tosdrMediator.fetchAllServices(function(services) {
			for (var serviceName in services) {
				getService(serviceName, services[serviceName]);
			}
			ss.storage.lastServicesUpdate = new Date().getTime();
		});
	}
	
	
	//check Location of tab
	checkLocation = function (tabUrl , domReady) {
		//ignoring about:* pages
		var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
		if(!regexp.test(tabUrl)){
			//show none.png
			button.setVisibility(true , tabUrl);
			button.setImage(data.url("class/none.png"), tabUrl);	
			panel.postMessage(false);
			return;
		}
		
		log("Matching service for url: " + tabUrl);
		var matchingServices = [];
		var matchedServiceDetails = [];
		//match every service with the current URL
		for(var service in ss.storage.services){
			var patt = new RegExp('https?://[^:]*' + ss.storage.services[service].url + '.*');
			//if the URL matches a service record it 
			if(patt.test(tabUrl)) {
				matchingServices.push(service);
				matchedServiceDetails.push(ss.storage.services[service]);
				// no need to continue the search since only the first service is used
				break;
			}
		}
		var matchedService = matchingServices[0];
		log("Matched service : " + matchedService);
		
		if(matchedService){
			ss.storage.currentActiveService = matchedService;
			var ratingClass = matchedServiceDetails[0].tosdr.rated;
			if(matchedServiceDetails[0].lastNotification){
				// Days since last notification for the matched service
				var daysSinceLastNotification = Math.ceil(Math.abs(new Date().getTime() - matchedServiceDetails[0].lastNotification) / (1000 * 3600 * 24));
				log("Last notification since " + daysSinceLastNotification + " day/s.");
				
				// Notify the user every 14 days with D && E Classes 
				if( daysSinceLastNotification > 13 ){
					if(ratingClasses.indexOf(ratingClass)  >= 3 && prefs.notificationsEnabled){
						notifications.notify({
						  title: matchedService,
						  text: RATING_TEXT[ratingClass],
						  iconURL : data.url("class/" + ratingClass.toLowerCase() + ".png"),
						  onClick: function (data) {
							  tabs.open("http://tosdr.org/#" + matchedService);
						  }
						});
						ss.storage.services[matchedService].lastNotification = new Date().getTime();
					}
				}
			}else{
				if(ratingClasses.indexOf(ratingClass)  >= 3 && prefs.notificationsEnabled){
					notifications.notify({
					  title: matchedService,
					  text: RATING_TEXT[ratingClass],
					  iconURL : data.url("class/" + ratingClass.toLowerCase() + ".png"),
					  onClick: function (data) {
						  tabs.open("https://tosdr.org/#" + matchedService);
					  }
					});
					ss.storage.services[matchedService].lastNotification = new Date().getTime();
				}
			}
			
			//show barButton
			button.setVisibility(true , tabUrl);
			var rated = matchedServiceDetails[0].tosdr.rated;
			var imageName =  rated ? rated.toLowerCase() : 'false';
			//set image in the bar button to the matching class
			button.setImage(data.url("class/" + imageName + ".png"), tabUrl);
		}else{
			ss.storage.currentActiveService = null;
			log("Not rated, yet.");
			//show none.png
			button.setVisibility(true , tabUrl);
			button.setImage(data.url("class/none.png"), tabUrl);	
			panel.postMessage(false);		
		}
	};

	// get service and store its data at simple-storage
	function getService(serviceName,serviceIndexData){
		log("Storing service " + serviceName);
		tosdrMediator.fetchCompactService(serviceName, function(service) {
			service.points = serviceIndexData.points;
			service.links = serviceIndexData.links;
			if (!service.tosdr)
				service.tosdr = {rated:false};
			ss.storage.services[serviceName] = service;
		});
	};

	// TOS-checker panel
	var panel = require("sdk/panel").Panel({
		width: 560,
		height: 475,
		name : "TOS-Panel",
		contentURL: data.url("popup.html"),
		contentScriptFile: [data.url("libs/jquery-1.11.0.min.js"),
							data.url("popup.js")],
		contentScriptWhen: 'ready',
		onShow: function(){
			if(ss.storage.currentActiveService){
				tosdrMediator.fetchExtendedService(ss.storage.currentActiveService, function(serviceData) {
					//post data to content script
					var Message = {};
					Message[ss.storage.currentActiveService] = ss.storage.services[ss.storage.currentActiveService];
					Message[ss.storage.currentActiveService].pointsData = serviceData.pointsData;
					//send data to content script
					log("GET: posting Matched service to panel..");
					panel.postMessage(Message);	
				});
			}
		},
		onMessage: function(message){
			//hide the panel if recieved close message
			if(message == "close")
				panel.hide();
		}
	});
	
    
	// create BarButton
    button = UrlbarButton({
		id: "tos-checker-toolbarbutton",
      	image : data.url("class/none.png"),
        onClick : function(){},
        tooltip : 'tosdr',
		panel: panel
    });
	
	// Hide panel when new tab opened
	// https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read/reviews/498180/
	tabs.on('open', function(window) {
		panel.hide();
	});
	
	// Listen for tab activation.
	tabs.on('activate', function(tab) {
        checkLocation(tab.url);
	});
	
	// Listen for tab content loads.
	tabs.on('ready', function(tab) {
        checkLocation(tab.url);
	});
};

exports.onUnload = function (reason) {
	if (reason !== 'shutdown') {
		button.remove();
	}
};
