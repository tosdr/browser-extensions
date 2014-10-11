/*global require: false, exports: false */
/*jslint indent: 2 */

/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs");
const { data } = require("sdk/self");
const database = require('./service/database');
const { match } = require('./service/match');

const { log } = require('./utils/log');
const { TEXT } = require('./ratings');

// TOS-checker panel
const panel = require("sdk/panel").Panel({
  width: 560,
  height: 475,
  name : "TOS-Panel",
  contentURL: data.url("popup.html"),
  contentScriptFile: [data.url("libs/jquery-1.11.0.min.js"),
            data.url("popup.js")],
  contentScriptWhen: 'ready',
  onMessage: function(message){
    //hide the panel if recieved close message
    if(message == "close") {
      panel.hide();
    }
  }
});

function rate(url, service) {
  log("posting Matched service to panel..", service);
  let name = service.name;
  panel.port.emit("service", { name : service });
}

// panel.port.on('get-rating-text', function(rating) {
//   panel.port.emit('set-rating-text', TEXT[rating]);
// });

// observe renderDataPoint to Request data
panel.port.on("renderDataPoint", function(renderdata) {
  console.log("Getting point " + renderdata[1]);
  database.points.get(renderdata[1]).then(function (point) {
    panel.port.emit("tosdrpoint", [renderdata[0], point]);
  });
});

// Hide panel when new tab opened
// https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read/reviews/498180/
tabs.on('open', function() {
  panel.hide();
});

function onTab({ url }) {
  let service = match(url);
  if (service) {
    rate(url, service);
  }
}

// Listen for tab activation.
tabs.on('activate', onTab);

// Listen for tab content loads.
tabs.on('ready', onTab);

exports.panel = panel;
