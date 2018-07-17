/*global $:false*/
"use strict";

window.Tosdr = (function () {
  var services = [];

  function loadService (serviceName, serviceIndexData) {
    return $.ajax('https://tosdr.org/services/' + serviceName + '.json', {
      success: function (service) {
        service.urlsRegExp  = [];
        for (var i in service.urls) {
          service.urlsRegExp.push(new RegExp('https?://[^:]*' + service.urls[i] + '.*'));
        }
        service.points = serviceIndexData.points;
        service.links = serviceIndexData.links;
        if (!service.tosdr) {
          service.tosdr = { rated: false };
        }
        services.push(service);
      },
      dataType: 'json'
    });
  }

  function init (callback) {
    $.ajax('https://tosdr.org/index/services.json', {
      success: function (servicesIndex) {
        var deferreds = [];
        for (var serviceName in servicesIndex) {
          deferreds.push(loadService(serviceName, servicesIndex[serviceName]));
        }
        $.when.apply(null, deferreds).then(callback);
      },
      dataType: 'json'
    });
  }

  function getService (url) {
    var matchingServices = services.filter(function (service) {
      for (var i in service.urlsRegExp) {
        return service.urlsRegExp[i].exec(url);
      }
    });
    return matchingServices.length > 0 ? matchingServices[0] : null;
  }

  return {
    init: init,
    getServices: function () {
      return services;
    },
    getService: getService
  };
})();
