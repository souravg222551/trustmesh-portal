// Listens for clicks on the "Launch Portal" button
document.getElementById('openPortalBtn').addEventListener('click', () => {
  // Opens your local Next.js portal in a new Chrome tab
  chrome.tabs.create({ url: 'http://localhost:3000' });
});