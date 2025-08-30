chrome.runtime.onInstalled.addListener(() => {
  console.log("Child Safe LLM Filter installed!");
  chrome.storage.sync.set({ ageLevel: 8 });
});
