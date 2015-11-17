/*global require: false, exports: false */
/*jslint indent: 2 */

/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";
		
require('./lib/service/setup');
require('./lib/tos-panel');
require('./lib/tos-urlbutton');
require('./lib/tos-notifications');
const { log } = require('./lib/utils/log');

exports.main = function(options, callbacks) {

	log("tosdr loaded");

};
