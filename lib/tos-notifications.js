/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const tabs = require("sdk/tabs"),
      { data } = require("sdk/self"),
      notifications = require("sdk/notifications"),
      { prefs } = require("sdk/simple-prefs");

const database = require('./service/database');
const { match } = require('./service/match');
const { log } = require('./utils/log');
const { LEVEL_D, TEXT, higherThan, iconURL } = require('./ratings');

function notify(url, service) {
  console.log("NOTIFY", url, service);
  if (higherThan(service.tosdr.rated, LEVEL_D) && !prefs.notificationsEnabled) {
    return;
  }

  if (typeof service.lastNotification !== "undefined") {
    database.services.notificationOutdated(service.name).then(null,
      function outdated() {
        createNotification(service);
      }
    );
  } else {
    createNotification(service);
  }
}

function createNotification(service) {
  notifications.notify({
    title: service.name,
    text: TEXT[service.tosdr.rated],
    iconURL : iconURL(service.tosdr.rated),
    onClick: function (data) {
      tabs.open("http://tosdr.org/#" + service.name);
    }
  });
  database.services.notified(service.name);
}

function onTab({ url }) {
  let service = match(url);
  if (service) {
    notify(url, service);
  }
}

// Listen for tab activation.
tabs.on('activate', onTab);

// Listen for tab content loads.
tabs.on('ready', onTab);
