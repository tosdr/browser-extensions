/*!
* TOS-checker addon for firefox
* Abdullah Diaa / @AbdullahDiaa
*
* Copyright 2012
* MPL 1.1/GPL 2.0/LGPL 2.1
*
* Date: 24 Feb. 2014
*/
/*global require: false, exports: false */
/*jslint indent: 2 */


"use strict";
const	tabs = require("sdk/tabs"),
		{ UrlbarButton } = require("urlbarbutton"),
		{ data } = require("sdk/self"),
		ss = require("sdk/simple-storage"),
		Request = require("sdk/request").Request;

const debug = false;
		
var		checkLocation,
		button;

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
			
	if (require('sdk/self').loadReason !== 'downgrade') {
		//Request services and store locally
		Request({
			url: "http://tosdr.org/index/services.json",
			onComplete: function (servicesIndex) {
				var services = servicesIndex.json;
				for (var serviceName in services){
			    	getService(serviceName ,services[serviceName]);
				}
			}
		}).get();
	}
	
	//check Location of tab
	checkLocation = function (tabUrl , domReady) {
		//ignoring about:* pages
		var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
		if(!regexp.test(tabUrl)) return;
		
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
			//show barButton
			button.setVisibility(true , tabUrl);
			var rated = matchedServiceDetails[0].tosdr.rated;
			var imageName =  rated ? rated.toLowerCase() : 'false';
			//set image in the bar button to the matching class
			button.setImage(data.url("class/" + imageName + ".png"), tabUrl);			
			//post data to content script
			var Message = {};
			Message[matchedService] = matchedServiceDetails[0];
			log("posting Matched service to panel..");
			panel.postMessage(Message);
		}else{
			//hide barbutton
			button.setVisibility(false , tabUrl);
		}
	};

	// get service and store its data at simple-storage
	function getService(serviceName,serviceIndexData){		
		Request({
			url: 'http://tosdr.org/services/' + serviceName + '.json',
			onComplete: function (serviceData) {
				var service = serviceData.json;
				service.points = serviceIndexData.points;
				service.links = serviceIndexData.links;
				if (!service.tosdr)
					service.tosdr = {rated:false};
				ss.storage.services[serviceName] = service;
			}
		}).get();
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
		onMessage: function(message){
			//hide the panel if recieved close message
			if(message == "close")
				panel.hide();
		}
	});
	
	// observe renderDataPoint to Request data
	panel.port.on("renderDataPoint", function(renderdata) {
		Request({
			url: 'http://tosdr.org/points/' + renderdata[1] + '.json',
			onComplete: function (dataPoint) {
				var dataPoint = dataPoint.json;
                var renderdataP = [];
                renderdataP[0] = renderdata[0];
                renderdataP[1] = dataPoint;
				//send data to content script
				panel.port.emit("tosdrpoint", renderdataP);
			}
		}).get();
	});
	
    
	// create BarButton
    button = UrlbarButton({
		id: "tos-checker-toolbarbutton",
      	image : data.url("class/none.png"),
        onClick : function(){},
        tooltip : 'TOS-checker',
		panel: panel
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
