const LOGOUT_URL = "https://accounts.google.com/Logout";
const SETTINGS_URL = "chrome://settings/clearBrowserData";
const ICON_PATH = "icon.png";
const LOGOUT_RETRY_COUNT = 3;

const PURGE_DATA_TYPES = {
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
};

const PURGE_OPTIONS = { since: 0 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function purge() {
  try {
    await chrome.browsingData.remove(PURGE_OPTIONS, PURGE_DATA_TYPES);
  } catch (e) {
    console.error(e);
  }
}

async function waitForTabLoaded(tabId, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if ((await chrome.tabs.get(tabId))?.status === "complete") return true;
    } catch {}
    await sleep(200);
  }
  return false;
}

async function openSettingsAndWait() {
  const tab = await chrome.tabs.create({ url: SETTINGS_URL, active: true });

  while (true) {
    await sleep(200);
    try {
      const currentTab = await chrome.tabs.get(tab.id);
      if (!currentTab.url.includes("clearBrowserData")) {
        try {
          await chrome.tabs.remove(tab.id);
        } catch {}
        break;
      }
    } catch {
      break;
    }
  }
}

async function performLogoutRequest() {
  let win;
  try {
    win = await chrome.windows.create({
      url: LOGOUT_URL,
      type: "popup",
      width: 100,
      height: 100,
      focused: false
    });
    const tabId = win?.tabs?.[0]?.id;

    if (tabId) {
      for (let i = 0; i < LOGOUT_RETRY_COUNT; i++) {
        await chrome.tabs.update(tabId, { url: LOGOUT_URL });
        await waitForTabLoaded(tabId);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (win?.id) chrome.windows.remove(win.id).catch(() => {});
  }
}

async function closeOtherTabs(keepId) {
  await Promise.all(
    (await chrome.tabs.query({}))
      .filter((t) => t.id !== keepId)
      .map((t) => chrome.tabs.remove(t.id).catch(() => {}))
  );
}

async function notify(title, message) {
  try {
    const id = await chrome.notifications.create("", {
      type: "basic",
      iconUrl: chrome.runtime.getURL(ICON_PATH),
      title,
      message
    });
    setTimeout(() => chrome.notifications.clear(id), 3000);
  } catch {}
}

async function openTempTab() {
  try {
    return (await chrome.tabs.create({ active: true }))?.id;
  } catch {
    return null;
  }
}

chrome.action.onClicked.addListener(async () => {
  const { enableAutoPurge, logoutEnabled } = await chrome.storage.sync.get({
    enableAutoPurge: false,
    logoutEnabled: true
  });

  enableAutoPurge ? await purge() : await openSettingsAndWait();

  if (logoutEnabled) {
    await sleep(500);
    await performLogoutRequest();
  }

  const newTabId = await openTempTab();
  await closeOtherTabs(newTabId);

  await purge();

  await notify(
    "Purge complete",
    "All data has been purged and other tabs closed."
  );
});
