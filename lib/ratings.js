/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

const { data } = require("sdk/self");

exports.CLASSES = ['none', 'B' , 'C', 'D', 'E'];

exports.NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: ";

exports.TEXT = {
  0 :       exports.NOT_RATED_TEXT,
  "false" : exports.NOT_RATED_TEXT,
  "none"  : exports.NOT_RATED_TEXT,
  "A" :     "The terms of service treat you fairly, respect your rights and follows the best practices.",
  "B" :     "The terms of services are fair towards the user but they could be improved.",
  "C" :     "The terms of service are okay but some issues need your consideration.",
  "D" :     "The terms of service are very uneven or there are some important issues that need your attention.",
  "E" :     "The terms of service raise very serious concerns."
};

exports.LEVEL_NONE = exports.CLASSES.indexOf('none');
exports.LEVEL_D = exports.CLASSES.indexOf('D');

exports.higherThan = function higherThan(aRated, bRated) {
  return exports.CLASSES.indexOf(aRated) < bRated;
};

exports.iconURL = function iconURL(rating) {
  let imageName =  rating != false ? rating.toLowerCase() : 'false';
  return data.url("class/" + imageName + ".png");
};
