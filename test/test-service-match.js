/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const database = require('./service/database');
const { match } = require('./service/match');

// This URL isn't going to be loaded
const TEST_URL = "https://tosdr.org/";
const TEST_DOMAIN = "tosdr.org";
const TEST_SERVICE = {
  "id": "TEST",
  "tosdr": {
    "rated": "B"
  },
  "url": TEST_DOMAIN
};

const ABOUT_URL = "about:blank";
const DATA_URL = "data:text/html;charset=utf-8,<title>data url</title>";

exports["test about url"] = function (assert) {
  let { valid, service } = match(ABOUT_URL);
  assert.ok(!valid, "about:* urls are not considered valid urls");
  assert.equal(service, null, "service should be null");
};

exports["test data url"] = function (assert) {
  let { valid, service } = match(DATA_URL);
  assert.ok(!valid, "data uris are not considered valid urls");
  assert.equal(service, null, "service should be null");
};

exports["test valid url"] = function (assert, done) {
  // first test that the TEST_URL is not in our ratings but considered valid
  let { valid, service } = match(TEST_URL);
  assert.ok(valid, "the " + TEST_URL + " is a valid urls");
  assert.equal(service, null, "a service for " + TEST_DOMAIN + " does not exist, it is not yet rated");

  // add the TEST_SERVICE to our system and ensure that we are returned the service
  database.services.set("TEST", TEST_SERVICE).then(function () {
    let { valid, service } = match(TEST_URL);
    assert.ok(valid, "the " + TEST_URL + " is a valid urls");
    assert.equal(service, TEST_SERVICE, "service returned and should equal the test service");
    done();
  });
};

require('sdk/test').run(exports);
