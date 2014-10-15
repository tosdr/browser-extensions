/*!
* TOS-checker addon for firefox
* Abdullah Diaa / @AbdullahDiaa
*
* Copyright 2012
* MPL 1.1/GPL 2.0/LGPL 2.1
*
*/
/*global require: false, exports: false */
/*jslint indent: 2 */

/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const ss = require("sdk/simple-storage");
const { Class } = require('sdk/core/heritage');
const { defer } = require('sdk/core/promise');
const { merge } = require("sdk/util/object");

const { getBaseDomain } = require('../utils/tld');
const { log } = require('../utils/log');
const Service = require('./service');

var BaseClass = Class({
  daysSince: function daysSince(time, days) {
    let now = new Date().getTime();
    let daysDelta = Math.ceil(Math.abs(now - time) / (1000 * 3600 * 24));
    log("Days since data updated " + daysDelta + " day/s ago.");
    return daysDelta > days;
  }
});

var Services = Class({
  extends: BaseClass,
  initialize: function initialize() {
    if (!ss.storage.tosdrServices) {
      ss.storage.tosdrServices = {};
    }
  },
  update: function update() {
    let deferred = defer();
    let that = this;
    Service.update().then(function (services) {
      Object.keys(services).forEach(function (name) {
        that.set(name, services[name]);
        // It's necessary to update each service from the network because the list
        // doesn't give us a domain or url we can match against
        // This seems like a real problem with the API
        let srv = services[name];
        Service.get(name).then(function (service) {
          that.set(name, merge(srv, service));
        });
      });
      ss.storage.lastServicesUpdate = new Date().getTime();
      deferred.resolve(services);
    }, deferred.reject);
    return deferred.promise;
  },
  isListOutdated : function isListOutdated() {
    let deferred = defer();
    if (typeof ss.storage.lastServicesUpdate === "undefined") {
      deferred.reject();
    } else {
      if (this.daysSince(ss.storage.lastServicesUpdate, 13)) { deferred.resolve(); }
      else { deferred.resolve(); }
    }
    return deferred.promise;
  },
  findByDomain: function findByDomain(url) {
    let domain = getBaseDomain(url);
	log(domain);
    // log("findByDomain", url, domain,  Object.keys(ss.storage.tosdrServices));
    var match = Object.keys(ss.storage.tosdrServices).find(function (name) {
      return ss.storage.tosdrServices[name].service.url == domain;
    });
    // log("MATCH", match, (ss.storage.tosdrServices[match] || null));
    if (typeof ss.storage.tosdrServices[match] !== "undefined") {
      return ss.storage.tosdrServices[match].service;
    }
    return null;
  },
  set: function set(name, service) {
    let deferred = defer();

    ss.storage.tosdrServices[name] = {};
    ss.storage.tosdrServices[name].service = service;
    ss.storage.tosdrServices[name].updated = new Date().getTime();

    deferred.resolve(service);
    return deferred.promise;
  },
  get: function get(name) {
    let deferred = defer();
    let that = this;
    this.isOutdated(name).then(
      function notOutdated() {
        if (typeof ss.storage.tosdrServices[name] === "undefined") {
          deferred.reject(name);
        } else {
          deferred.resolve(ss.storage.tosdrServices[name].service);      
        }
      },
      function isOutdated() {
        Service.get(name).then(function (service) {
          that.set(name, service);
          deferred.resolve(service);
        });
      });
    return deferred.promise;
  },
  isOutdated: function isOutdated(name) {
    let deferred = defer();

    if (typeof ss.storage.tosdrServices[name] === "undefined") {
      deferred.reject(name);
    } else {
      if (this.daysSince(ss.storage.tosdrServices[name].updated, 13)) { deferred.reject(name); }
      else { deferred.resolve(name); }      
    }
    return deferred.promise;
  },
  notified: function notified(name) {
    let deferred = defer();
    if (typeof ss.storage.tosdrServices[name] === "undefined") {
      deferred.reject(name);
    } else {
      ss.storage.tosdrServices[name].service.lastNotification = new Date().getTime();      
      deferred.resolve(ss.storage.tosdrServices[name].service);
    }
    return deferred.promise;
  },
  notificationOutdated: function notificationOutdated(name) {
    let deferred = defer();
    if (typeof ss.storage.tosdrServices[name].service.lastNotification === "undefined") {
      deferred.reject();
    } else {
      if (this.daysSince(ss.storage.tosdrServices[name].service.lastNotification, 13)) { deferred.reject(); }
      else { deferred.resolve(); }      
    }
    return deferred.promise;
  }
});

exports.services = new Services();
