/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const { setInterval, clearInterval } = require('sdk/timers');
const database = require('./database');

const ONE_SECOND = 1000;
const ONE_MIN = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MIN;
const ONE_DAY = 24 * ONE_HOUR;

function updateServices() {
  database.services.isListOutdatedOrFirstTime().then(
    function () {},
    function outdated() { database.services.update(); }
  );
}

updateServices();

let updateIntervalID = setInterval(updateServices, ONE_DAY);

require('sdk/system/unload').when(function shutdown() {
  clearInterval(updateIntervalID);
});
