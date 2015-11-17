/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs");

const { UrlbarButton } = require("./urlbarbutton");
const { panel } = require('./tos-panel');
const { match } = require('./service/match');

const { iconURL } = require('./ratings');

// create BarButton
const button = UrlbarButton({
  id: "tosdr-checker-toolbarbutton",
  image : iconURL('none'),
  onClick : true,
  tooltip : 'tosdr',
  panel: panel
});

function reset(url) {
  button.setVisibility(false , url);
  button.setImage(iconURL('none'), url);
}

function rate(url, service) {
  button.setVisibility(true , url);
  // a null service means there is currently no rating available
  let icon = (null === service)? iconURL('none') : iconURL(service.tosdr.rated);
  button.setImage(icon, url);
}

function onTab({ url }) {
  let { valid, service } = match(url);
  if (valid) {
    rate(url, service);
  } else {
    reset(url);
  }
}

// Listen for "pageshow" which triggered on page load, ready or retrieval from the bfcache. 
tabs.on('pageshow', onTab);

// Listen for tab activation.
tabs.on('activate', onTab);

require('sdk/system/unload').when(function shutdown(reason) {
  if (reason !== 'shutdown') {
    button.remove();
  }
});

exports.button = button;
