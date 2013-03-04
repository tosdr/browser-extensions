/*global require: false, exports: false */
/*jslint forin: true, indent: 2 */

var winUtils = require("sdk/window/utils"),
  windows = require("windows").browserWindows,
  UrlbarButton;

UrlbarButton = function (options) {
  "use strict";

  if (!options || !options.id) {
    return;
  }

  var windowTracker,
    // Methods used internally
    getContentDocument,
    // Methods exposed externally
    ensureButtonsExists,
    getButtons,
    setImage,
    setVisibility,
    getVisibility,
    remove;

  getContentDocument = function (windowElement) {
    var doc, pageWindow, pageTabBrowser;

    if (windowElement.gBrowser) {
      pageWindow = windowElement;
    } else {
      pageWindow = windowElement.ownerDocument.defaultView;
    }

    if (windowElement.tagName === 'tab') {
      pageTabBrowser = pageWindow.gBrowser.getBrowserForTab(windowElement);
      doc = pageTabBrowser.contentDocument;
    } else {
      doc = pageWindow.gBrowser.contentDocument;
    }

    return doc;
  };

  ensureButtonsExists = function () {
    var windows, i, length, window, button, urlbarIcons,
      elements = [];

    windows = winUtils.windows();

    for (i = 0, length = windows.length; i < length; i++) {
      window = windows[i];
      if (winUtils.isDocumentLoaded(window) && winUtils.isXULBrowser(window)) {
        urlbarIcons = window.document.getElementById("urlbar-icons");

        if (urlbarIcons) {
          button = window.document.getElementById(options.id);

          if (!button) {
            button = window.document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "image");

            button.id = options.id;
            button.className = "urlbar-icon";
            button.collapsed = true;

            if (options.tooltip) {
              button.setAttribute("tooltiptext", options.tooltip);
            }
            if (options.image) {
              button.setAttribute("src", options.image);
            }
            if (options.onClick) {
              button.addEventListener("click", function (event) {
                var doc = getContentDocument(event.originalTarget);
		        if (options.panel)
					options.panel.show(button);
                options.onClick.call(doc, doc.location.href, event);
              });
            }

            urlbarIcons.insertBefore(button, urlbarIcons.firstChild);
          }

          elements.push(button);
        }
      }
    }

    return elements;
  };

  getButtons = function (href) {
    var button, windows, i, length, window,
      elements = [];

    windows = winUtils.windows();

    for (i = 0, length = windows.length; i < length; i++) {
      window = windows[i];
      if (
        winUtils.isDocumentLoaded(window) && winUtils.isXULBrowser(window) &&
        (!href || (window.gBrowser && href === getContentDocument(window).location.href))
      ) {
        button = window.document.getElementById(options.id);
        if (button) {
          elements.push(button);
        }
      }
    }

    return elements;
  };

  setImage = function (src, href) {
    getButtons(href).forEach(function (button) {
      button.src = src;
    });
  };

  setVisibility = function (show, href) {
    getButtons(href).forEach(function (button) {
      button.collapsed = !show;
    });
  };

  getVisibility = function (href) {
    var shown;

    getButtons(href).forEach(function (button) {
      shown = (shown || !button.collapsed) ? true : false;
    });

    return shown;
  };

  remove = function () {
	  if (options.panel)
	  	options.panel.destroy();
    windowTracker.unload();
  };

  windows.on('open', function(window) {
    ensureButtonsExists();
  });

  // Init on startup as well
  ensureButtonsExists();


  //TODO: Track when a window closes and remove it again then?

  return {
    getButtons : getButtons,
    setImage : setImage,
    setVisibility : setVisibility,
    getVisibility : getVisibility,
    remove : remove
  };
};

exports.UrlbarButton = UrlbarButton;