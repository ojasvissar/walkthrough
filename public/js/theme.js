(() => {
  const key = 'walkthrough.theme';
  const root = document.documentElement;
  const headerColor = document.querySelector('meta[name="theme-color"]');
  const validTheme = (value) => value === 'light' || value === 'dark' ? value : null;
  let preference;
  try { preference = validTheme(localStorage.getItem(key)); }
  catch { preference = null; }

  function applyTheme() {
    const theme = preference || 'dark';
    const dark = theme === 'dark';
    const changed = root.dataset.theme !== theme;
    root.dataset.theme = theme;
    if (headerColor) headerColor.content = dark ? '#090909' : '#f3efe8';
    for (const toggle of document.querySelectorAll('[data-theme-toggle]')) {
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    if (changed) window.dispatchEvent(new CustomEvent('walkthrough:theme', { detail: theme }));
  }

  applyTheme();
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = validTheme(event.newValue);
    applyTheme();
  });

  document.addEventListener('DOMContentLoaded', () => {
    for (const toggle of document.querySelectorAll('[data-theme-toggle]')) {
      toggle.innerHTML =
        '<svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h6v2h-2v6h2v2h6v4h-2v2h-4v2H8v-2H4v-4H2V8h2V6h4zm0 4H6v2H4v4h2v4h4v2h2v-2h4v-2h-4v-2h-2V6H8z"/></svg>' +
        '<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 1h2v4h-2V1zm0 18h2v4h-2zm8-8h4v2h-4zM1 11h4v2H1zM5 4h2v2H5zm12 14h2v2h-2zm0-14h2v2h-2zM5 18h2v2H5zm4-11h6v2H9zm-2 2h2v6H7zm8 0h2v6h-2zm-6 6h6v2H9z"/></svg>';
      toggle.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(key, preference); }
        catch { /* The current tab can still use the selected theme. */ }
        applyTheme();
      });
    }
    applyTheme();
    for (const toggle of document.querySelectorAll('[data-theme-toggle]')) toggle.hidden = false;
  }, { once: true });
})();
