chrome.action.onClicked.addListener(async (tab) => {
  try {
    // First, inject the content script if it's not already there
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Small delay to ensure content script is ready
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleCard' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message sending failed:', chrome.runtime.lastError.message);
        }
      });
    }, 100);
    
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
});