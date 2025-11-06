import { checkIfUpdateNeeded } from './background/database';
import { checkDonationReminder } from './background/donation';
import { handleExtensionInstalled } from './background/install';
import { initializePageAction } from './background/pageAction';

chrome.action.setBadgeText({ text: '' });

chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        void initializePageAction(tab);
    }
});

chrome.tabs.onCreated.addListener((tab) => {
    void initializePageAction(tab);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        void initializePageAction(tab);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    void handleExtensionInstalled();
});

chrome.runtime.onStartup.addListener(() => {
    void checkIfUpdateNeeded();
});

void checkDonationReminder();
