/* global browser, localStorage, log, RATING_TEXT, getServices, getService, getIconForService */
/* requires ./popup/js/servicedata.js */

function checkNotification(service) {
  const last = localStorage.getItem(`notification/${service.name}/last/update`);
  const lastRate = localStorage.getItem(`notification/${service.name}/last/rate`);
  let shouldShow = false;

  if (!service.rated) { return; }

  const rate = service.rated;
  if (rate === 'D' || rate === 'E') {
    if (last) {
      const lastModified = parseInt(Date.parse(last), 10);
      log(lastModified);
      const daysSinceLast = (new Date().getTime() - lastModified) / (1000 * 60 * 60 * 24);
      log(daysSinceLast);

      if (daysSinceLast > 7) {
        shouldShow = true;
      }
    } else {
      shouldShow = true;
    }
  } else if (lastRate === 'D' || lastRate === 'E') {
    shouldShow = true;
  }


  if (shouldShow) {
    localStorage.setItem(`notification/${service.name}/last/update`, new Date().toDateString());
    localStorage.setItem(`notification/${service.name}/last/rate`, rate);

    browser.notifications.create('tosdr-notify', {
      type: 'basic',
      title: service.name,
      message: RATING_TEXT[rate],
      iconUrl: './icons/icon@2x.png',
    });

    browser.notifications.onClicked.addListener((notificationId) => {
      browser.notifications.clear(notificationId);
      browser.tabs.create({
        url: `https://beta.tosdr.org/service/${service.slug}`,
      });
    });
  }
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  // console.log('initializePageAction', tab);
  return getService(tab).then((service) => {
    // console.log('got service', service);
    if (service) {
      browser.pageAction.setIcon({
        tabId: tab.id,
        path: getIconForService(service),
      });
      browser.pageAction.setPopup({
        tabId: tab.id,
        popup: `popup/popup.html#${service.mainDomain}`,
      });
      browser.pageAction.show(tab.id);
      checkNotification(service);
    } else {
      browser.pageAction.setIcon({
        tabId: tab.id,
        path: 'icons/class/none.png',
      });
      browser.pageAction.setPopup({
        tabId: tab.id,
        popup: 'popup/popup.html#none',
      });
      browser.pageAction.show(tab.id);
    }
  }).catch((err) => {
    if (err.message === 'no domain name provided') {
      return;
    }
    console.error(err); // eslint-disable-line no-console
  });
}

getServices().then((services) => {
  browser.storage.local.set(services).then(() => {
    /* When first loaded, initialize the page action for all tabs.
    */
    const gettingAllTabs = browser.tabs.query({});
    return gettingAllTabs.then((tabs) => {
      tabs.forEach((t) => {
        // Only active tabs should get the pageAction
        if (t.active) {
          initializePageAction(t);
        }
      });
    });
  });
});

// Run when loading the tab completes
// console.log('setting tab event listeners');
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  // console.log('updated', id, changeInfo, tab);
  if (changeInfo.status === 'complete') {
    initializePageAction(tab);
  }
});
