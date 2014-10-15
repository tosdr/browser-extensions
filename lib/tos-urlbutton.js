/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs"),
      { data } = require("sdk/self");

const { UrlbarButton } = require("urlbarbutton");
const { panel } = require('./tos-panel');
const { match } = require('./service/match');

const { iconURL } = require('./ratings');

// create BarButton
const button = UrlbarButton({
  id: "tosdr-checker-toolbarbutton",
  image : data.url("class/none.png"),
  onClick : function(){},
  tooltip : 'tosdr',
  panel: panel
});

function reset(url) {
  button.setVisibility(true , url);
  button.setImage(iconURL('none'), url);
}

function rate(url, service) {
  button.setVisibility(true , url);
  button.setImage(iconURL(service.tosdr.rated), url);
}

function onTab({ url }) {
  let service = match(url);
  if (service) {
    rate(url, service);
  } else {
    reset(url);
  }
}

// Listen for tab activation.
tabs.on('activate', onTab);

// Listen for tab content loads.
tabs.on('ready', onTab);

require('sdk/system/unload').when(function shutdown(reason) {
  if (reason !== 'shutdown') {
    button.remove();
  }
});

exports.button = button;
