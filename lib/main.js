/*!
* TOS-checker addon for firefox
* Abdullah Diaa / @AbdullahDiaa
*
* Copyright 2012
* MPL 1.1/GPL 2.0/LGPL 2.1
*
* Date: 16 August 2012
*/

exports.main = function(options, callbacks) {
  console.log(options.staticArgs.foo);
    var pageMod = require("page-mod");
	var tabs = require("tabs");
	var bb = require("barbutton");
	var data = require("self").data;
	var ss = require("simple-storage");
	var tabBrowser = require("tab-browser");
	var Request = require("request").Request;
	var { Hotkey } = require("hotkeys");
	var showForPage = require('showforpage').ShowForPage,
					listeners , checkLocation;


	// create storage for services locally
	if (!ss.storage.services)
		ss.storage.services = {};
	
	//Request services and store locally
	Request({
		url: "http://tos-dr.info/index/services2.json",
		onComplete: function (servicesIndex) {
			var services = servicesIndex.json;
			for (var serviceName in services){
		    	getService(serviceName ,services[serviceName]);
			}
		}
	}).get();

	//check Location of tab
	checkLocation = function (tabUrl) {
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
                // Add hotkey Shift+T to show/hide the panel of TOS-checker
    	    	var showHotKey = Hotkey({
			    	combo: "shift-t",
			    	onPress: function() {
                     if(matchedService){
                        if(panel.isShowing)
    				    	panel.hide();
				    	else
				    		panel.show();
                      }		
			    	}
		    	});
			}
		}
		var matchedService = matchingServices[0];
		if(matchedService){
			//show barButton
			barbutton.collapsed(false);
			var rated = matchedServiceDetails[0].tosdr.rated;
			var imageName =  rated ? rated.toLowerCase() : 'false';
			//set image in the bar button to the matching class
			barbutton.setImage(data.url("class/" + imageName + ".png"));
			//post data to content script
			var Message = {};
			Message[matchedService] = matchedServiceDetails[0];
			panel.postMessage(Message);
		}else{
			//hide barbutton
			barbutton.collapsed(true);
		}
	};

	// get service and store its data at simple-storage
	function getService(serviceName,serviceIndexData){
		Request({
			url: 'http://tos-dr.info/services/' + serviceName + '.json',
			onComplete: function (serviceData) {
				var service = serviceData.json;
				service.urlRegExp = new RegExp('https?://[^:]*' + service.url + '.*');
				service.points = serviceIndexData.points;
				service.links = serviceIndexData.links;
				if (!service.tosdr) {
				service.tosdr = {rated:false};
				}
				ss.storage.services[serviceName] = service;
			}
		}).get();
	}
	
	// TOS-checker panel
	var panel = require("panel").Panel({
		width: 525,
		height: 475,
		name : "TOS-Panel",
		contentURL: data.url("popup.html"),
		contentScriptFile: [data.url("libs/jquery.js"),
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
			url: 'http://tos-dr.info/points/' + renderdata[1] + '.json',
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
	let barbutton = bb.BarButton({
		id: "tos-checker-toolbarbutton",
		label: "TOS",
		alwaysShowLabel: true,
		title: "TOS-Checker",
		image: data.url("a.png"),
		panel:panel,
		onCommand:function(){}
	});
	
	// listener for tab lcoation URL
	listeners = showForPage({
		onLocationChange : checkLocation
	});
};



exports.onUnload = function (reason) {
	if (reason !== 'shutdown') {
		listeners.remove();
	}
};