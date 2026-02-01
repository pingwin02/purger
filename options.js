document.addEventListener("DOMContentLoaded", () => {
  const logoutCheckbox = document.getElementById("logoutCheckbox");
  const autoPurgeCheckbox = document.getElementById("autoPurgeCheckbox");

  chrome.storage.sync.get(
    {
      logoutEnabled: true,
      enableAutoPurge: false
    },
    (items) => {
      logoutCheckbox.checked = items.logoutEnabled;
      autoPurgeCheckbox.checked = items.enableAutoPurge;
    }
  );

  logoutCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ logoutEnabled: logoutCheckbox.checked });
  });

  autoPurgeCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableAutoPurge: autoPurgeCheckbox.checked });
  });
});
