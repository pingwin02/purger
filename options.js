const checkbox = document.getElementById("logoutCheckbox");

// Load saved value
chrome.storage.sync.get({ logoutEnabled: true }, ({ logoutEnabled }) => {
  checkbox.checked = logoutEnabled;
});

// Save on change
checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ logoutEnabled: checkbox.checked });
});
