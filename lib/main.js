exports.main = function() {
var pageMod = require("page-mod");
var tabs = require("tabs");
var bb = require("barbutton");
var data = require("self").data;
var ss = require("simple-storage");
var tabBrowser = require("tab-browser");
var Request = require("request").Request;
var showForPage = require('showforpage').ShowForPage,
  listeners , checkLocation;
   
  
  checkLocation = function (tabUrl) {
    var matchingServices = [];
    var matchedServiceDetails = [];
    for(var x in ss.storage.services){
        var patt = ss.storage.services[x].urlRegExp;
        var result = patt.exec(tabUrl);
        if(result != null){
            matchingServices.push(x);
            matchedServiceDetails.push(ss.storage.services[x]);
        }
    }
    var matchedService = matchingServices[0];
    if(matchedService){
        barbutton.collapsed(false);
        var rated = matchedServiceDetails[0].tosdr.rated;
        var imageName =  rated ? rated.toLowerCase() : 'false';
        barbutton.setImage(data.url("class/" + imageName + ".png"));
        var Message = {};
        Message[matchedService] = matchedServiceDetails[0];
        console.log(matchedServiceDetails[0]);
        panel.postMessage(Message);
    }else{
        barbutton.collapsed(true);
    }
  };

var panel = require("panel").Panel({
  width: 525,
  height: 475,
  name : "TOS-Panel",
  contentURL: data.url("popup.html"),
  contentScriptFile: [data.url("libs/jquery.js"),
                      data.url("popup.js")],
  contentScriptWhen: 'ready',
  onMessage: function(message){
      if(message == "close"){
          panel.hide();
      }
  }
});
panel.port.on("renderDataPoint", function(dataPointId) {
    Request({
                url: 'http://tos-dr.info/points/' + dataPointId + '.json',
			    onComplete: function (dataPoint) {
			        var dataPoint = dataPoint.json;
                    panel.port.emit("tosdrpoint", dataPoint);
			    }
	}).get();
    
  console.log(dataPointId);
});

if (!ss.storage.services)
    ss.storage.services = {};

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
                    console.log(ss.storage.services[serviceName].name);
			    }
	}).get();
}

Request({
    url: "http://tos-dr.info/index/services2.json",
    onComplete: function (servicesIndex) {
        var services = servicesIndex.json;
        for (var serviceName in services){
            getService(serviceName ,services[serviceName]);
        }
    }
}).get();


let barbutton = bb.BarButton({
	id: "tos-checker-toolbarbutton",
	label: "TOS",
	alwaysShowLabel: true,
	title: "TOS-Checker",
	image: data.url("a.png"),
    panel:panel,
	onCommand: function () {
	}
});

listeners = showForPage({
    onLocationChange : checkLocation
 });

};

exports.onUnload = function (reason) {
  if (reason !== 'shutdown') {
    listeners.remove();
  }
};