// CourseForge YouTube Content Script
(function () {
  function injectCourseForgeButton() {
    if (document.getElementById('courseforge-yt-btn')) return;

    // Locate YouTube action buttons container underneath video title
    const actionsMenu = document.querySelector('#top-row #actions #actions-inner') || document.querySelector('#menu-container');
    if (!actionsMenu) return;

    const btn = document.createElement('button');
    btn.id = 'courseforge-yt-btn';
    btn.innerHTML = `⚡ Save to CourseForge`;
    btn.style.cssText = `
      background-color: #f54e00;
      color: #ffffff;
      border: none;
      border-radius: 18px;
      padding: 6px 14px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background-color 0.2s;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#d04200';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = '#f54e00';
    });

    btn.addEventListener('click', () => {
      btn.innerHTML = `✓ Saved to CourseForge!`;
      btn.style.backgroundColor = '#1f8a65';
    });

    actionsMenu.appendChild(btn);
  }

  // Observe DOM changes on YouTube SPA navigation
  const observer = new MutationObserver(injectCourseForgeButton);
  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(injectCourseForgeButton, 2000);
})();
