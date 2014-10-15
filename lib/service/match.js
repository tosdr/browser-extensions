/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const database = require('./database');
const { log } = require('../utils/log');

function match(url) {
  // we want to ignore the about URLs cause they coo
  if (/^about:/.test(url)) {
    log("Ignoring service match for about:url: ", url);
    return null;
  }
  log("Matching service for url: ", url);
  let service = database.services.findByDomain(url);
  log("Matched service ", service, " for url ", url);
  return service;
}

exports.match = match;
