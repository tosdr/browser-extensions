
/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const { getBaseDomain } = require('./utils/tld');

const CLARKBW_NET = "http://clarkbw.net";
const CRAZY_CLARKBW_NET = "http://crazy.clarkbw.net";

exports["test getBaseDomain without host"] = function (assert) {
  assert.equal(getBaseDomain(CLARKBW_NET), "clarkbw.net", "base domain should be clarkbw.net");
};

exports["test getBaseDomain with host"] = function (assert) {
  assert.equal(getBaseDomain(CRAZY_CLARKBW_NET), "clarkbw.net", "base domain should be clarkbw.net");
};

require('sdk/test').run(exports);
