
const { Cc, Ci, Cr } = require("chrome");

var ios = Cc['@mozilla.org/network/io-service;1']
          .getService(Ci.nsIIOService);

var tlds = Cc["@mozilla.org/network/effective-tld-service;1"]
          .getService(Ci.nsIEffectiveTLDService);

function newURI(uriStr, base) {
  try {
    let baseURI = base ? ios.newURI(base, null, null) : null;
    return ios.newURI(uriStr, null, baseURI);
  }
  catch (e) {
    if (e.result == Cr.NS_ERROR_MALFORMED_URI) {
      throw new Error("malformed URI: " + uriStr);
    }
    if (e.result == Cr.NS_ERROR_FAILURE ||
        e.result == Cr.NS_ERROR_ILLEGAL_VALUE) {
      throw new Error("invalid URI: " + uriStr);
    }
  }
}

let getBaseDomain = exports.getBaseDomain = function getBaseDomain (url) {
  let uri = newURI(url.toString());
  let tld = null;
  try {
    tld = tlds.getBaseDomain(uri);
  }
  catch (e) {
    if (e.result != Cr.NS_ERROR_INSUFFICIENT_DOMAIN_LEVELS &&
        e.result != Cr.NS_ERROR_HOST_IS_IP_ADDRESS) {
      throw e;
    }
  }
  return tld;
};
