/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs"),
      { data } = require("sdk/self");

const { button } = require('./tos-urlbutton');
const { iconURL } = require('./ratings');

const URL_500PX = "http://500px.com";
const URL_AMAZON = "https://www.amazon.com";
const URL_GITHUB = "https://github.com/";

exports["test urlbutton"] = function (assert, done) {
  tabs.on("ready", function (tab) {
    if (tab.url == URL_GITHUB) {
      assert.equal(URL_GITHUB, tab.url, "opened the " + URL_GITHUB + " site");
      assert.ok(button.getVisibility(tab.url), "tab urlbutton should be visible for " + URL_GITHUB);
      console.log("button.getImage(tab.url)", button.getImage(tab.url));
      assert.ok(button.getImage(tab.url), iconURL('none'), "icon should be none for " + URL_GITHUB);
      tab.close();
      done();
    }
  });
  tabs.open(URL_GITHUB);
};

require('sdk/test').run(exports);
