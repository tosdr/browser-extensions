/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const { Request } = require("sdk/request");
const { defer } = require('sdk/core/promise');

const database = require('./database');

const { BASE_URL, serviceAPIPath } = require('utils/service');

function get(name) {
  let deferred = defer();
  Request({
    url: BASE_URL + serviceAPIPath(name),
    onComplete: function (response) {
      var service = response.json;
      if (response.statusText == "OK" && response.status == 200 && service) {
        deferred.resolve(service);
      } else {
        deferred.reject(response);
      }
    }
  }).get();
  return deferred.promise;
}

exports.get = get;
