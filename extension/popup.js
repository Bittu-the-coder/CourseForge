document.addEventListener('DOMContentLoaded', async () => {
  const titleEl = document.getElementById('videoTitle');
  const urlEl = document.getElementById('videoUrl');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');

  // Query active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
    titleEl.textContent = tab.title.replace('- YouTube', '').trim();
    urlEl.textContent = tab.url;

    saveBtn.addEventListener('click', () => {
      // Save to chrome extension storage or trigger postMessage to CourseForge web app
      chrome.storage.local.get(['courseforge_imported_videos'], (result) => {
        const list = result.courseforge_imported_videos || [];
        list.push({
          title: tab.title,
          url: tab.url,
          timestamp: new Date().toISOString(),
        });
        chrome.storage.local.set({ courseforge_imported_videos: list }, () => {
          statusMsg.style.display = 'block';
        });
      });
    });
  } else {
    titleEl.textContent = 'No YouTube Video Active';
    urlEl.textContent = 'Navigate to a video on YouTube to save.';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.5';
  }
});
