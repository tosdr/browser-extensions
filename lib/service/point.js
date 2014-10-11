/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const { Request } = require("sdk/request");
const { defer } = require('sdk/core/promise');

const database = require('./database');

const { BASE_URL, pointPath } = require('utils/service');

function get(name) {
  let deferred = defer();
  Request({
    url: BASE_URL + pointPath(name),
    onComplete: function (response) {
      var point = response.json;
      if (response.statusText == "OK" && response.status == 200 && point) {
        database.points.set(name, point);
        deferred.resolve(point);
      } else {
        deferred.reject(response);
      }
    }
  }).get();
  return deferred.promise;
}

exports.get = get;
