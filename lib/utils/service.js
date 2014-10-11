const { prefs } = require("sdk/simple-prefs");

if (! ("BASE_URL" in prefs) ) {
  prefs["BASE_URL"] = 'http://tosdr.org'; 
}

exports.BASE_URL = prefs["BASE_URL"];

function pointPath(name) {
  return '/points/' + name + '.json';
}
exports.pointPath = pointPath;

exports.SERVICES_PATH = '/index/services.json'

function servicePath(name) {
  return '/services/' + name + '.json'
}
exports.servicePath = servicePath;
