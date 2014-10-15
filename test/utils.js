/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const port = exports.port = 8099;

const { prefs } = require("sdk/simple-prefs");
prefs.BASE_URL = 'http://localhost:' + port;

const { SERVICES_PATH, servicePath, serviceAPIPath } = require('utils/service');

const { readURISync } = require("sdk/net/url");
const fixtures = require('./fixtures');

const POINT_ID = '3uiIrLyj8Hw';

let server = null;

exports.startServer = function () {
  let SERVICES_DATA = JSON.parse(readURISync(fixtures.url("services-index.json")));
  let POINT_DATA = JSON.parse(readURISync(fixtures.url("pointsData-github.json")));
  let TEST_SERVICES = {
    '500px' : JSON.parse(readURISync(fixtures.url("service-500px.json"))),
    'amazon' : JSON.parse(readURISync(fixtures.url("service-amazon.json"))),
    'google' : JSON.parse(readURISync(fixtures.url("service-google.json"))),
    'github' : JSON.parse(readURISync(fixtures.url("service-github.json")))
  };

  server = require('sdk/test/httpd').startServerAsync(port);

  server.registerPathHandler(SERVICES_PATH, function (request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(SERVICES_DATA));
  });

  Object.keys(TEST_SERVICES).forEach(function (key) {
    server.registerPathHandler(servicePath(key), function (request, response) {
      response.setHeader("Content-Type", "application/json", false);
      response.write(JSON.stringify(TEST_SERVICES[key]));
    });    
  })

  server.registerPathHandler(servicePath('500px'), function (request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(SERVICE_500PX_DATA));
  });

  server.registerPathHandler(serviceAPIPath('github'), function (request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(POINT_DATA));
  });
};

exports.stopServer = function (done) {
  if (server) {
    if (done) {
      server.stop(done);
    } else {
      server.stop();
    }
  }
};
