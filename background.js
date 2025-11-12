const LOGOUT_URL = "https://accounts.google.com/Logout";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function purge() {
  try {
    await chrome.browsingData.remove(
      { since: 0 },
      {
        appcache: true,
        cache: true,
        cacheStorage: true,
        cookies: true,
        downloads: true,
        fileSystems: true,
        formData: true,
        history: true,
        indexedDB: true,
        localStorage: true,
        pluginData: true,
        serviceWorkers: true,
        webSQL: true,
      },
    );
  } catch (err) {
    console.error("Browsing data error:", err || chrome.runtime.lastError);
  }
}

async function openLogoutAndClose() {
  const { logoutEnabled } = await chrome.storage.sync.get({
    logoutEnabled: true,
  });
  if (!logoutEnabled) return;
  await sleep(500);
  await chrome.windows.create({
    url: LOGOUT_URL,
    type: "normal",
    width: 800,
    height: 600,
    focused: false,
  });
  await sleep(750);
}

async function closeOtherTabs() {
  const activeTabs = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });
  if (!activeTabs || !activeTabs[0]) return;

  const currentTabId = activeTabs[0].id;
  const allTabs = await chrome.tabs.query({});

  const closePromises = allTabs
    .filter((tab) => tab.id !== currentTabId)
    .map((tab) => chrome.tabs.remove(tab.id).catch(() => {}));

  await Promise.all(closePromises);
}

async function notify(title, message) {
  try {
    const id = await chrome.notifications.create("", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title,
      message,
    });
    await sleep(3000);
    await chrome.notifications.clear(id);
  } catch (e) {
    console.error("Notification error:", e);
  }
}

chrome.action.onClicked.addListener(async () => {
  await purge();
  await openLogoutAndClose();
  await closeOtherTabs();
  await purge();
  await notify(
    "Purge complete",
    "All data has been purged and other tabs closed.",
  );
});
