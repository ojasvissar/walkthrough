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
    if (headerColor) headerColor.content = dark ? '#1d201a' : '#eee8dc';
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
        '<svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 14.4A9 9 0 0 1 9.6 3.2 9.1 9.1 0 1 0 20.8 14.4Z"/></svg>' +
        '<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/></svg>';
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
