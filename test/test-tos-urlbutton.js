/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs");
const { setTimeout } = require('sdk/timers');

const database = require('./service/database');

const { button } = require('./tos-urlbutton');
const { iconURL } = require('./ratings');

// This is the iPhone captive portal test page, its fast and simple to load
// We fake this page to be the apple.com domain in the database
const TEST_URL = "https://www.apple.com/library/test/success.html";
const TEST_DOMAIN = "apple.com";
const TEST_SERVICE = {
  "id": "TEST",
  "tosdr": {
    "rated": "B"
  },
  "url": TEST_DOMAIN
};

// running this test first lets us ensure the database is primed with our TEST_SERVICE
exports["test 1a run first test service"] = function (assert, done) {
  let testButtonImage = function (i) { return i.src === iconURL(TEST_SERVICE.tosdr.rated); }
  database.services.set("TEST", TEST_SERVICE).then(function () {
    tabs.open({
      url: TEST_URL,
      onReady: function(tab) {
        setTimeout(function () {
          // setTimeout to allow the other onReady events to fire before
          assert.ok(button.getButtons(tab.url).every(testButtonImage), "tab urlbutton should be using the correct image");
          assert.ok(button.getVisibility(tab.url), "tab urlbutton should be visible for " + TEST_URL);
          tab.close(done);
        }, 10);
      }
    });
  });
}

// For an unrated page we want to show the default "none" image to encourage users 
// to submit ratings via the panel
exports["test not rated pages"] = function (assert, done) {
  let testButtonImage = function (i) { return i.src === iconURL('none'); }
  tabs.open({
    url: 'http://www.example.com/',
    onReady: function(tab) {
      setTimeout(function () {
        // setTimeout to allow the other onReady events to fire before
        assert.ok(button.getButtons(tab.url).every(testButtonImage), "tab urlbutton should be set to the none image for unrated domains");
        assert.ok(button.getVisibility(tab.url), "the tab urlbutton should be visible for unrated pages");
        tab.close(done);
      }, 10);
    }
  });
}

// about:* pages should not show any button as we don't want to encourage any kind of rating
exports["test about pages"] = function (assert, done) {
  let testButtonImage = function (i) { return i.src === iconURL('none'); }
  tabs.open({
    url: 'about:blank',
    onReady: function(tab) {
      setTimeout(function () {
        // setTimeout to allow the other onReady events to fire before
        assert.ok(button.getButtons(tab.url).every(testButtonImage), "tab urlbutton should be set to the none image");
        assert.ok(! button.getVisibility(tab.url), "however the tab urlbutton should not be visible for about pages ");
        tab.close(done);
      }, 10);
    }
  });
}

// file urls should not show any button, ratings are not possible
exports["test file urls"] = function (assert, done) {
  let testButtonImage = function (i) { return i.src === iconURL('none'); }
  tabs.open({
    url: 'file:///',
    onReady: function(tab) {
      setTimeout(function () {
        // setTimeout to allow the other onReady events to fire before
        assert.ok(button.getButtons(tab.url).every(testButtonImage), "tab urlbutton should be set to the none image");
        assert.ok(! button.getVisibility(tab.url), "however the tab urlbutton should not be visible for file urls");
        tab.close(done);
      }, 10);
    }
  });
}

// data uris should not show any button, ratings are not possible
exports["test data uris"] = function (assert, done) {
  let testButtonImage = function (i) { return i.src === iconURL('none'); }
  tabs.open({
    url: 'data:text/html;charset=utf-8,<title>do not rate</title>',
    onReady: function(tab) {
      setTimeout(function () {
        // setTimeout to allow the other onReady events to fire before
        assert.ok(button.getButtons(tab.url).every(testButtonImage), "tab urlbutton should be set to the none image");
        assert.ok(! button.getVisibility(tab.url), "however the tab urlbutton should not be visible for data urls");
        tab.close(done);
      }, 10);
    }
  });
}

require('sdk/test').run(exports);
