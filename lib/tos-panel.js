/*global require: false, exports: false */
/*jslint indent: 2 */

/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs");
const { data } = require("sdk/self");
const database = require('./service/database');
const { match } = require('./service/match');

const Point = require('./service/point');

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
  onShow: function(){
    let service = match(tabs.activeTab.url);
    if (service) {
      Point.get(service.id).then(function ({ pointsData }) {
        service.pointsData = pointsData;
        panel.port.emit("service", service);
      });
    }else{
		// Show Not rated panel
    	panel.port.emit("service", null);
    }
  },
  onMessage: function(message){
    //hide the panel if recieved close message
    if(message == "close") {
      panel.hide();
    }
  }
});

// panel.port.on('get-rating-text', function(rating) {
//   panel.port.emit('set-rating-text', TEXT[rating]);
// });

// Hide panel when new tab opened
// https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read/reviews/498180/
tabs.on('open', function() {
  panel.hide();
});


exports.panel = panel;
