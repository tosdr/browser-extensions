/*!
* TOS-checker addon for firefox
* Abdullah Diaa / @AbdullahDiaa
*
* Copyright 2012
* MPL 1.1/GPL 2.0/LGPL 2.1
*
* Date: 16 August 2012
*/
/*global require: false, exports: false */
/*jslint indent: 2 */

(function () {
  "use strict";

    var pageMod = require("sdk/page-mod");
	var tabs = require("sdk/tabs");
	var urlbarButton = require("urlbarbutton").UrlbarButton;
	var data = require("sdk/self").data;
	var ss = require("sdk/simple-storage");
	var tabBrowser = require("tabs/utils");
	var Request = require("sdk/request").Request;
	var showForPage = require('showforpage').ShowForPage,
					listeners , checkLocation ,button;

exports.main = function(options, callbacks) {

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
		var matchingServices = [];
		var matchedServiceDetails = [];
		//match every service with the current URL
		for(var x in ss.storage.services){
			var patt = ss.storage.services[x].urlRegExp;
			var result = patt.exec(tabUrl);
			//if the URL matches a service record it 
			if(result != null){
				matchingServices.push(x);
				matchedServiceDetails.push(ss.storage.services[x]);
			}
		}
		var matchedService = matchingServices[0];
		
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
				service.urlRegExp = new RegExp('https?://[^:]*' + service.url + '.*');
				service.points = serviceIndexData.points;
				service.links = serviceIndexData.links;
				if (!service.tosdr)
					service.tosdr = {rated:false};
				ss.storage.services[serviceName] = service;
			}
		}).get();
	}

	// TOS-checker panel
	var panel = require("sdk/panel").Panel({
		width: 560,
		height: 475,
		name : "TOS-Panel",
		contentURL: data.url("popup.html"),
		contentScriptFile: [data.url("libs/jquery-1.9.1.min.js"),
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
    button = urlbarButton({
		id: "tos-checker-toolbarbutton",
      	image : data.url("class/false.png"),
        onClick : function(){},
        tooltip : 'TOS-checker',
		panel: panel
    });
	
	
	// listener for tab lcoation URL
	listeners = showForPage({
		onLocationChange : checkLocation
	});
};

exports.onUnload = function (reason) {
	if (reason !== 'shutdown') {
		button.remove();
		listeners.remove();
	}
};
}());