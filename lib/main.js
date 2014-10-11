/*!
* TOS-checker addon for firefox
* Abdullah Diaa / @AbdullahDiaa
*
* Copyright 2012
* MPL 1.1/GPL 2.0/LGPL 2.1
*
* Date: 24 Feb. 2014
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
