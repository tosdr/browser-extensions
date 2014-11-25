/*!
* TOS-checker addon for firefox 0.4.1
*
*/

/*global require: false, exports: false */
/*jslint indent: 2 */

/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";
		
require('./service/setup');
require('./tos-panel');
require('./tos-urlbutton');
require('./tos-notifications');
const { log } = require('./utils/log');

exports.main = function(options, callbacks) {

	log("tosdr loaded");

};
