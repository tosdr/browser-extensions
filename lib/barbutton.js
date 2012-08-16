/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2010 Erik Vold
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *   Abdullah Diaa <abdullah.diaa@gmail.com>
 *  
 * ***** END LICENSE BLOCK ***** */

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

var {unload} = require("unload+");
var {listen} = require("listen");
var winUtils = require("window-utils");

exports.BarButton = function BarButton(options) {
  var unloaders = [],
      addressBarID = "urlbar-icons",
      destroyed = false,
      destroyFuncs = [];
  const debug = false;

  var delegate = {
    onTrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location || destroyed)
        return;
      
      var button, urlbarIcons;

      let doc = window.document;
      function $(id) doc.getElementById(id);
      function xul(type) doc.createElementNS(NS_XUL, type);

      
      let button = xul("image");
      button.setAttribute("id", options.id);
      button.setAttribute("class", "urlbar-icon");
      button.setAttribute("collapsed", false);
      if (options.image) {
        button.setAttribute("src", options.image);
      }

      button.addEventListener("click", function() {
        if (options.onCommand)
          options.onCommand({}); // TODO: provide something?

        if (options.panel) {
          options.onCommand({});
          options.panel.show(button);
        }
      }, true);

      // find a toolbar to insert the barbutton into
      let tb;
      if (addressBarID) {
        tb = $(addressBarID);
      }
      if (!tb) {
        tb = barbuttonExists(doc, options.id);
      }

      // found a toolbar to use?
      if (tb) {
        tb.insertBefore(button, tb.firstChild);
      }

      var saveTBNodeInfo = function(e) {
        addressBarID = button.parentNode.getAttribute("id") || "";
      };

      window.addEventListener("aftercustomization", saveTBNodeInfo, false);

      // add unloader to unload+'s queue
      var unloadFunc = function() {
    	button.parentNode.removeChild(button);
        window.removeEventListener("aftercustomization", saveTBNodeInfo, false);
      };
      var index = destroyFuncs.push(unloadFunc) - 1;
      listen(window, window, "unload", function() {
        destroyFuncs[index] = null;
      }, false);
      unloaders.push(unload(unloadFunc, window));
    },
    onUntrack: function (window) {}
  };
  var tracker = new winUtils.WindowTracker(delegate);

  return {
    destroy: function() {
      if (destroyed) return;
      destroyed = true;

      if (options.panel)
        options.panel.destroy();

      // run unload functions
      destroyFuncs.forEach(function(f) f && f());
      destroyFuncs.length = 0;

      // remove unload functions from unload+'s queue
      unloaders.forEach(function(f) f());
      unloaders.length = 0;
    },
    collapsed : function(status) {
      for each (var win in winUtils.windowIterator()) {
        if ("chrome://browser/content/browser.xul" != win.location) return;

        let doc = win.document;
        let $ = function (id) doc.getElementById(id);
        let barbutton = $(options.id);
        if (barbutton)
          barbutton.setAttribute("collapsed", status);
      }
    },
    setImage : function(src) {
      for each (var win in winUtils.windowIterator()) {
        if ("chrome://browser/content/browser.xul" != win.location) return;

        let doc = win.document;
        let $ = function (id) doc.getElementById(id);
        let barbutton = $(options.id);
        if (barbutton)
          barbutton.setAttribute("src", src);
      }
    },
    getStatus : function(status) {
      for each (var win in winUtils.windowIterator()) {
        if ("chrome://browser/content/browser.xul" != win.location) return;

        let doc = win.document;
        let $ = function (id) doc.getElementById(id);
        let barbutton = $(options.id);
        if (barbutton)
          return barbutton.getAttribute("collapsed");
        else
          return null;
      }
    },
    
  };
};

function barbuttonExists(doc, id) {
  var toolbars = doc.getElementsByTagNameNS(NS_XUL, "toolbar");
  for (var i = toolbars.length - 1; ~i; i--) {
    if ((new RegExp("(?:^|,)" + id + "(?:,|$)")).test(toolbars[i].getAttribute("currentset")))
      return toolbars[i];
  }
  return false;
}