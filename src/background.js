/* requires ./popup/js/servicedata.js */

getServices().then((services)=>{
  browser.storage.local.set(services).then(() => {
    /*When first loaded, initialize the page action for all tabs.
    */
    var gettingAllTabs = browser.tabs.query({});
    return gettingAllTabs.then((tabs) => {
      for (let tab of tabs) {
        //Only active tabs should get the pageAction
        if (tab.active){
          initializePageAction(tab);
        }
      }
    });
  });
});


/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  // console.log('initializePageAction', tab);
  return getService(tab).then((service)=>{
    console.log('got service', service);
    if (service) {
      browser.pageAction.setIcon({
        tabId: tab.id,
        path: getIconForService(service)
      });
      browser.pageAction.setPopup({
        tabId: tab.id,
        popup: 'popup/popup.html#' + service.mainDomain
      })
      browser.pageAction.show(tab.id);
      checkNotification(service);
    }else{
      browser.pageAction.setIcon({
        tabId: tab.id,
        path: 'icons/class/none.png'
      });
      browser.pageAction.setPopup({
        tabId: tab.id,
        popup: 'popup/popup.html#none'
      })
      browser.pageAction.show(tab.id);
    }
  }).catch(err => {
          if (err.message = 'no domain name provided') {
      return;
    }
    console.error(err);
  });
}

//Run when loading the tab completes
// console.log('setting tab event listeners');
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  // console.log('updated', id, changeInfo, tab);
  if (changeInfo.status == 'complete') {
    initializePageAction(tab);
  }
});
