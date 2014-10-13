var TosdrMediator = (function() {
  TosdrMediator.prototype.BASE_URL = 'https://tosdr.org';
  TosdrMediator.prototype.SERVICES_PATH = 'index/services';
  TosdrMediator.prototype.COMPACT_SERVICE_PATH = 'services';
  TosdrMediator.prototype.EXTENDED_SERVICE_PATH = 'api/1/service';
  TosdrMediator.prototype.FORMAT = 'json';

  function TosdrMediator() {
    this.Request = require("sdk/request").Request;
  }

  TosdrMediator.prototype.fetchAllServices = function(cb) {
    var servicesUrl = this.servicesUrl();
    return this.fetch(servicesUrl, cb);
  };

  TosdrMediator.prototype.fetchCompactService = function(serviceId, cb) {
    var compactServiceUrl = this.compactServiceUrl(serviceId);
    return this.fetch(compactServiceUrl, cb);
  };

  TosdrMediator.prototype.fetchExtendedService = function(serviceId, cb) {
    var extendedServiceUrl = this.extendedServiceUrl(serviceId);
    return this.fetch(extendedServiceUrl, cb);
  };

  TosdrMediator.prototype.servicesUrl = function() {
    return this.BASE_URL + "/" + this.SERVICES_PATH + "." + this.FORMAT;
  };

  TosdrMediator.prototype.compactServiceUrl = function(serviceId) {
    return this.BASE_URL + "/" + this.COMPACT_SERVICE_PATH + "/" + serviceId + "." + this.FORMAT;
  };

  TosdrMediator.prototype.extendedServiceUrl = function(serviceId) {
    return this.BASE_URL + "/" + this.EXTENDED_SERVICE_PATH + "/" + serviceId + "." + this.FORMAT;
  };

  TosdrMediator.prototype.fetch = function(url, cb) {
    return this.Request({
      url: url,
      onComplete: (function(_this) {
        return function(data) {
          cb(data.json);
        };
      })(this)
    }).get();
  };

  return TosdrMediator;

})();

exports.tosdrMediator = TosdrMediator;
