/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const database = require('./database');
const { log } = require('../utils/log');
const { isValidURI } = require('sdk/url');

function match(url) {
  let result = { valid : false, service : null };
  // Only urls that start with an http
  // This should include https and but not include about:, data:, file: etc
  result.valid = ((/^http/.test(url)) && isValidURI(url));
  if (result.valid) {
    log("Matching service for url: ", url);
    // service can return null, this means we do not have a rating for this domain
    result.service = database.services.findByDomain(url);
    log("Matched service ", result.service, " for url ", url);
  }
  return result;
}

exports.match = match;
