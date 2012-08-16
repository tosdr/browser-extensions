var urlbarButton = require('urlbarbutton').UrlbarButton,
    showForPage = require('showforpage').ShowForPage,
    request = require("request").Request,
    tabs = require('tabs'),
    ss = require("simple-storage"),
    pageMod = require("page-mod),
    flattrPattern = new (require("match-pattern").MatchPattern)("*.flattr.com"),
    buttonImage = require("self").data.url("a.png"),
    data = require("self").data,
    tbb = require("toolbarbutton"),
    button,
    listeners,
    checkLocation;
  const {Cc,Ci,Cu} = require("chrome");
 

  // If we go over quota - then just reset
  ss.on("OverQuota", function () {
    ss.storage.flattrUrlCache = {version : version};
  });

  if (!ss.storage.flattrUrlCache || ss.storage.flattrUrlCache.version !== version) {
    ss.storage.flattrUrlCache = {version : version};
  }

  fillRectRounded = function (canvasContext, x, y, w, h, r) {
    canvasContext.beginPath();
    canvasContext.moveTo(x + r, y);
    canvasContext.lineTo(x + w - r, y);
    canvasContext.quadraticCurveTo(x + w, y, x + w, y + r);
    canvasContext.lineTo(x + w, y + h - r);
    canvasContext.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    canvasContext.lineTo(x + r, y + h);
    canvasContext.quadraticCurveTo(x, y + h, x, y + h - r);
    canvasContext.lineTo(x, y + r);
    canvasContext.quadraticCurveTo(x, y, x + r, y);
    canvasContext.closePath();
    canvasContext.fill();
  };

  buttonSetImageCount = function (src, count, href) {
    if (!count) {
      button.setImage(src, href);
      return;
    }

    var size = 7,
      borderX = 0,
      borderY = 1,
      bottomY = 16,
      rightX = 16;

    if (count > 99999) {
      count = '+';
    } else if (count > 999) {
      count = Math.floor(count / 1000) + 'k';
    } else if (count < 100) {
      size = 8;
      borderX = 1;
    }

    button.getButtons(href).forEach(function (elem) {
      var doc = elem.ownerDocument,
        img = doc.createElementNS('http://www.w3.org/1999/xhtml', 'img');

      img.onload = function () {
        var canvas = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
          context = canvas.getContext('2d'),
          width;

        canvas.height = canvas.width = this.width;
        context.drawImage(this, 0, 0);

        context.font = 'bold ' + size + 'px "Verdana", sans-serif';
        context.textAlign = 'end';

        width = context.measureText(count).width;

        context.fillStyle = "rgba(50,50,50,0.7)";
        fillRectRounded(context, rightX - width - borderX * 2, bottomY - size - borderY * 2, width + borderX * 2, size + borderY * 2, 2);

        context.fillStyle = '#fff';
        context.fillText(count, rightX - borderX, bottomY - borderY - 1);

        button.setImage(canvas.toDataURL('image/png'), href);
      };

      img.src = src;
    });
  };

  getPageStatus = function (href) {
    if (pb.isActive) {
      return false;
    }

    var cacheItem = ss.storage.flattrUrlCache[href];

    if (cacheItem) {
      if (Date.now() - cacheItem.timestamp > 24 * 3600 * 1000) {
        delete ss.storage.flattrUrlCache[href];
        return false;
      }

      return {
        flattrable : cacheItem.flattrable !== false,
        redirected : cacheItem.flattrable !== true && cacheItem.flattrable !== false,
        url : cacheItem.flattrable === true ? 'https://flattr.com/submit/auto?url=' + encodeURIComponent(href) : cacheItem.flattrable,
        flattrs : cacheItem.flattrs
      };
    }
  };

  enforcePageStatus = function (href, status, removeOnFalse) {
    if (status && (status.flattrable || (!status.flattrable && removeOnFalse)) && button.getButtons(href).length) {
      buttonSetImageCount(buttonImage, status.flattrs, href);
      button.setVisibility(status.flattrable, href);
    }
  };

  setPageStatus = function (href, type, flattrable, flattrs, enforce) {
    var cacheItem;

    if (!pb.isActive) {
      cacheItem = ss.storage.flattrUrlCache[href];

      if (!cacheItem || (Date.now() - cacheItem.timestamp > 24 * 3600 * 1000)) {
        cacheItem = {};
      } else if (
        cacheItem.flattrable && (
          (cacheItem.type === 'page' && type !== 'page') ||
          (cacheItem.type === 'canonical' && type !== 'page' && type !== 'canonical')
        )
      ) {
        return;
      }

      cacheItem.timestamp = Date.now();
      cacheItem.flattrable = flattrable;
      cacheItem.type = type;

      if (flattrable && flattrs !== undefined) {
        cacheItem.flattrs = flattrs;
      }

      ss.storage.flattrUrlCache[href] = cacheItem;
    }

    if (enforce !== false) {
      enforcePageStatus(href, {
        flattrable : flattrable !== false,
        flattrs : flattrs
      });
    }
  };

  checkAPI = function (href, url, callback) {
    if (pb.isActive || href.indexOf('http') !== 0 || (url && url.indexOf('http') !== 0)) {
      if (callback) {
        callback(false);
      }
      return;
    }

    var status = getPageStatus(url || href);

    if (status && (!status.flattrable || status.flattrs !== undefined)) {
      if (callback) {
        callback(status.flattrable, status.flattrs);
      } else if (callback === undefined) {
        enforcePageStatus(href, status);
      }
      return;
    }

    request({
      url: "https://api.flattr.com/rest/v2/things/lookup?url=" + encodeURIComponent(url || href),
      onComplete: function (response) {
        var flattrable = false,
          flattrs;

        if (response.status === 200 && response.json) {
          if (response.json.message && response.json.message === 'flattrable') {
            flattrable = true;
            flattrs = false;
          } else if (response.json.type && response.json.type === 'thing') {
            flattrable = true;
            flattrs = response.json.flattrs;
          }
        }

        if (callback) {
          callback(flattrable, flattrs);
        } else {
          if (url) {
            setPageStatus(url, 'page', flattrable, flattrs, callback === undefined);
            if (flattrable) {
              flattrable = 'https://flattr.com/submit/auto?url=' + encodeURIComponent(url);
            }
          }
          setPageStatus(href, url ? 'canonical' : 'page', flattrable, flattrs, callback === undefined);
        }
      }
    }).get();
  };

  checkLinks = function (doc, href, callback) {
    var enforce = callback ? false : callback,
      status = getPageStatus(href),
      links,
      i,
      length,
      callbackAPI;

    if (status.flattrable) {
      callback(status.url);
      return;
    }

    links = doc.querySelectorAll('link[rel~="payment"]');
    for (i = 0, length = links.length; i < length; i += 1) {
      if (links[i].href && flattrPattern.test(links[i].href)) {
        setPageStatus(href, 'payment', links[i].href, undefined, enforce);
        if (callback) {
          callback(links[i].href);
        }
        break;
      }
    }

    if (!pb.isActive) {
      links = doc.querySelectorAll('link[rel~="canonical"]');
      if (links.length && links[0].href && links[0].href !== href) {
        if (callback) {
          callbackAPI = function (flattrable, flattrs) {
            callback(flattrable ? 'https://flattr.com/submit/auto?url=' + encodeURIComponent(links[0].href) : false, flattrs);
          };
        } else {
          callbackAPI = callback;
        }
        checkAPI(href, links[0].href, callbackAPI);
      }
    }
  };

  checkLocation = function (href, domReady) {
    var status = getPageStatus(href);

    if (href.indexOf('http') !== 0) {
      button.setVisibility(false, href);
    } else if (status) {
      enforcePageStatus(href, status, true);
    } else {
      button.setVisibility(false, href);

      checkAPI(href);

      if (domReady) {
        checkLinks(this, href, function (url, flattrs) {
          setPageStatus(href, url, flattrs);
        });
      }
    }
  };

  // If a page is loaded in the background then we need to actively cache the page URL
  checkPage = function (href, inBackground) {
    if (inBackground) {
      checkAPI(href, false, false);
    }
  };

  checkNewLink = function (href, data, inBackground) {
    if (!data.rels.payment && !data.rels.canonical) {
      return;
    }

    var enforce = inBackground ? false : undefined;

    if (data.rels.payment && flattrPattern.test(data.href)) {
      setPageStatus(href, 'relpayment', data.href, enforce);
    }
    if (data.rels.canonical && href !== data.href) {
      checkAPI(href, data.href, enforce);
    }
  };

  autosubmit = function (href, event) {
    if (event.type !== "click" || event.button !== 0) {
      return;
    }

    checkLinks(this, href, function (url) {
      if (url) {
        tabs.open(url);
      }
    });
  };
  
  
exports.main = function() {
button = urlbarButton({
      id : 'tos-check-button',
      image : require("self").data.url("a.png"),
      tooltip : 'Go to Flattr thing'
    });
    button.setVisibility(true, "https://www.google.com/");
listeners = showForPage({
      onLocationChange : checkLocation,
      onPageShow : checkPage,
      onLink : checkNewLink
});
    
// setting userChrome.css to change label CSS in the toolbar button
let sss = Cc["@mozilla.org/content/style-sheet-service;1"]
            .getService(Ci.nsIStyleSheetService);
let ios = Cc["@mozilla.org/network/io-service;1"]
            .getService(Ci.nsIIOService);

var panel = require("panel").Panel({
  width: 525,
  height: 350,
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
  
var Request = require("request").Request;
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
                    console.log(ss.storage.services[serviceName].url);
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


let toolbarbutton = tbb.ToolbarButton({
	id: "tos-checker-toolbarbutton",
	label: "TOS",
	alwaysShowLabel: true,
	title: "TOS-Checker",
	image: data.url("a.png"),
    panel:panel,
	onCommand: function () {
	}
});
toolbarbutton.moveTo({
		toolbarID: "nav-bar",
		forceMove: true
});
let chromeStylesheet = data.url("chrome.css");
let chromeStylesheetUri = ios.newURI(chromeStylesheet, null, null);
sss.loadAndRegisterSheet(chromeStylesheetUri, sss.AGENT_SHEET);

pageMod.PageMod({
    include: "*", // All DOM windows (ie. all pages + all iframes).
    contentScriptWhen: "start", // page starts loading, at this point you have
                                // the head of the document and no more
    onAttach: function onAttach(worker) {
            if (worker.tab.url == worker.url){
               var matchingServices = [];
    var matchedServiceDetails = [];
    for(var x in ss.storage.services){
        var patt = ss.storage.services[x].urlRegExp;
        var result = patt.exec(worker.tab.url);
        if(result != null){
            matchingServices.push(x);
            matchedServiceDetails.push(ss.storage.services[x]);
        }  
    }
    var matchedService = matchingServices[0];
    if(matchedService){
        toolbarbutton.updateLabel(matchedService);
        var Message = {};
        Message[matchedService] = matchedServiceDetails[0];
        panel.postMessage(Message);
    }
    

            }
            // cleanup the attached worker
            worker.destroy();
        }
    }
);

tabs.on('activate', function(tab) {
    var matchingServices = [];
    var matchedServiceDetails = [];
    for(var x in ss.storage.services){
        var patt = ss.storage.services[x].urlRegExp;
        var result = patt.exec(tab.url);
        if(result != null){
            matchingServices.push(x);
            matchedServiceDetails.push(ss.storage.services[x]);
        }  
    }
    var matchedService = matchingServices[0];
    if(matchedService){
        toolbarbutton.updateLabel(matchedService);
        var Message = {};
        Message[matchedService] = matchedServiceDetails[0];
        panel.postMessage(Message);
    }
});
};

exports.onUnload = function (reason) {
  if (reason !== 'shutdown') {
    button.remove();
  }
};