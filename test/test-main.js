/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

exports["test main"] = function (assert) {
  // var main = require("main");
  assert.pass("Unit test running!");
};

require('sdk/test').run(exports);
