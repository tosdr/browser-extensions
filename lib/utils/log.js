/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const prefs = require("sdk/preferences/service");
const { id } = require("sdk/self");

const ADDON_LOG_LEVEL_PREF = "extensions." + id + ".sdk.console.logLevel";
const debug = true;

prefs.set(ADDON_LOG_LEVEL_PREF, "all");

// Tsodr Logger
exports.log = function() {
	if(debug){
	    var args = Array.slice(arguments);
	    args.unshift("tosdr: ");
	    console.log.apply(null, args);
	}
};
