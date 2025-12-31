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
        webSQL: true
      }
    );
  } catch (err) {
    console.error("Browsing data error:", err || chrome.runtime.lastError);
  }
}

async function waitForTabLoaded(tabId, timeoutMs = 10000) {
  const intervalMs = 100;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.status === "complete") {
      return true;
    }
    await sleep(intervalMs);
  }
  return false;
}

async function logout() {
  await openLogout();
  await openLogout();
}

async function openLogout() {
  const { logoutEnabled } = await chrome.storage.sync.get({
    logoutEnabled: true
  });
  if (!logoutEnabled) return;
  const win = await chrome.windows.create({
    url: LOGOUT_URL,
    type: "normal",
    width: 800,
    height: 600,
    focused: false
  });
  const tabId = win && win.tabs && win.tabs[0] && win.tabs[0].id;
  try {
    await waitForTabLoaded(tabId, 10000);
  } catch (e) {}
}

async function closeOtherTabs() {
  const activeTabs = await chrome.tabs.query({
    currentWindow: true,
    active: true
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
      message
    });
    await sleep(1500);
    await chrome.notifications.clear(id);
  } catch (e) {
    console.error("Notification error:", e);
  }
}

async function openTempTab() {
  try {
    const tab = await chrome.tabs.create({ active: true });
    return tab && tab.id;
  } catch (e) {
    console.error("Error creating temp tab:", e);
    return null;
  }
}

chrome.action.onClicked.addListener(async () => {
  await purge();
  await logout();
  await openTempTab();
  await closeOtherTabs();
  await purge();
  await notify("Purge complete", "All data has been purged and other tabs closed.");
});
