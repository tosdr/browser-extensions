/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const { Request } = require("sdk/request");
const { defer } = require('sdk/core/promise');
const { merge } = require("sdk/util/object");
const { log } = require('../utils/log');

const database = require('./database');
const { BASE_URL, SERVICES_PATH, servicePath } = require('utils/service');

function update() {
  log("GET/ ", BASE_URL + SERVICES_PATH);
  let deferred = defer();
  Request({
    url: BASE_URL + SERVICES_PATH,
    onComplete: function (response) {
      var services = response.json;
      if (response.statusText == "OK" && response.status == 200 && services) {
        deferred.resolve(services);
      } else {
        deferred.reject(response);
      }
    }
  }).get();
  return deferred.promise;
}

exports.update = update;

function get(name) {
  log("GET/ ", BASE_URL + servicePath(name));
  let deferred = defer();
  // get service and store its data at simple-storage
  Request({
    url: BASE_URL + servicePath(name),
    onComplete: function (response) {
      var service = response.json;
      if (response.statusText == "OK" && response.status == 200 && service) {
        service = merge({ rated : false }, service);
        deferred.resolve(service);
      } else {
        deferred.reject(response);
      }
    }
  }).get();
  return deferred.promise;
}

exports.get = get;
