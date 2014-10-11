
/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const database = require('./service/database');

const { startServer, stopServer } = require('./utils');

exports["test 1a database defaults to outdated"] = function (assert, done) {
  startServer();

  database.services.isListOutdated().then(
    function updated() {
      assert.fail("by default the db should be outdated");
      stopServer(done);
    },
    function outdated() {
      assert.pass("by default the db is oudated");
      stopServer(done);
    }
  );

};

exports["test database updates the list"] = function (assert, done) {
  startServer();

  function fail(reason) {
    assert.fail(reason);
    stopServer(done);
  }

  database.services.update().then(function (services) {
    assert.ok("500px" in services, "500px is in the services fixture as expected");
    stopServer(done);
  }, fail);

};

require('sdk/test').run(exports);
