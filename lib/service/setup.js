/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
