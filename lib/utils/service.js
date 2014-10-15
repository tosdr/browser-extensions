const { prefs } = require("sdk/simple-prefs");

if (! ("BASE_URL" in prefs) ) {
  prefs["BASE_URL"] = 'https://tosdr.org'; 
}

exports.BASE_URL = prefs["BASE_URL"];

exports.SERVICES_PATH = '/index/services.json'

function servicePath(name) {
  return '/services/' + name + '.json'
}
exports.servicePath = servicePath;

function serviceAPIPath(name) {
  return '/api/1/service/' + name + '.json'
}
exports.serviceAPIPath = serviceAPIPath;