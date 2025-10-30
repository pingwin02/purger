const LOGOUT_URL = "https://accounts.google.com/Logout";

function purge(callback) {
  chrome.browsingData.remove(
    { since: 0 },
    {
      appcache: true,
      cache: true,
      cookies: true,
      downloads: true,
      fileSystems: true,
      formData: true,
      history: true,
      indexedDB: true,
      localStorage: true,
      pluginData: true,
      serviceWorkers: true,
      cacheStorage: true,
    },
    function () {
      if (chrome.runtime.lastError)
        console.error("Browsing data error:", chrome.runtime.lastError);
      if (callback) callback();
    },
  );
}

function openLogoutAndClose(callback) {
  chrome.storage.sync.get({ logoutEnabled: true }, ({ logoutEnabled }) => {
    if (!logoutEnabled) {
      if (callback) callback();
      return;
    }

    chrome.windows.create(
      {
        url: LOGOUT_URL,
        type: "normal",
        width: 800,
        height: 600,
        focused: false,
      },
      function (win) {
        if (!win || !win.id) {
          if (callback) callback();
          return;
        }
        const id = win.id;
        setTimeout(() => {
          try {
            chrome.windows.remove(id);
          } catch (e) {}
          if (callback) callback();
        }, 1000);
      },
    );
  });
}

function closeOtherTabs(callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    const currentTabId = tabs[0].id;
    chrome.tabs.query({ currentWindow: true }, function (allTabs) {
      allTabs.forEach((tab) => {
        if (tab.id !== currentTabId) {
          try {
            chrome.tabs.remove(tab.id);
          } catch (e) {}
        }
      });
      if (callback) callback();
    });
  });
}

function notify(title, message) {
  chrome.notifications.create(
    "",
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: title,
      message: message,
    },
    function (id) {
      setTimeout(() => {
        try {
          chrome.notifications.clear(id);
        } catch (e) {}
      }, 5000);
    },
  );
}

chrome.action.onClicked.addListener(() => {
  openLogoutAndClose(() => {
    purge(() => {
      closeOtherTabs(() => {
        notify(
          "Purge complete",
          "All data has been purged and other tabs closed.",
        );
      });
    });
  });
});
