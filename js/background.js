chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({ css: ['video'] })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});
