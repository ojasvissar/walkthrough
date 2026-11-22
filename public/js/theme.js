(() => {
  const root = document.documentElement;
  const headerColor = document.querySelector('meta[name="theme-color"]');
  const themeKey = 'walkthrough.theme';
  const styleKey = 'walkthrough.style';
  const headerColors = {
    print: { dark: '#1d201a', light: '#eee8dc' },
    brutalist: { dark: '#171620', light: '#fdf1cc' },
  };
  let themeToggle;
  let styleToggle;

  function readPreference(key) {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }

  function savePreference(key, value) {
    try { localStorage.setItem(key, value); }
    catch { /* The selection still works in this tab. */ }
  }

  function applyAppearance(themeValue, styleValue) {
    const theme = themeValue === 'light' ? 'light' : 'dark';
    const style = styleValue === 'brutalist' ? 'brutalist' : 'print';
    const dark = theme === 'dark';
    const brutalist = style === 'brutalist';
    const themeChanged = root.dataset.theme !== theme;
    root.dataset.theme = theme;
    root.dataset.style = style;
    if (headerColor) headerColor.content = headerColors[style][theme];
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(dark));
      themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    if (styleToggle) {
      styleToggle.setAttribute('aria-pressed', String(brutalist));
      styleToggle.title = brutalist ? 'Switch to print style' : 'Try neo-brutalist style';
    }
    if (themeChanged) window.dispatchEvent(new CustomEvent('walkthrough:theme', { detail: theme }));
  }

  applyAppearance(readPreference(themeKey), readPreference(styleKey));
  window.addEventListener('storage', (event) => {
    if (event.key === themeKey) applyAppearance(event.newValue, root.dataset.style);
    if (event.key === styleKey) applyAppearance(root.dataset.theme, event.newValue);
    if (event.key === null) applyAppearance(null, null);
  });

  document.addEventListener('DOMContentLoaded', () => {
    themeToggle = document.querySelector('[data-theme-toggle]');
    styleToggle = document.querySelector('[data-style-toggle]');
    if (themeToggle) {
      themeToggle.innerHTML =
        '<svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 14.4A9 9 0 0 1 9.6 3.2 9.1 9.1 0 1 0 20.8 14.4Z"/></svg>' +
        '<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/></svg>';
      themeToggle.addEventListener('click', () => {
        const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        savePreference(themeKey, theme);
        applyAppearance(theme, root.dataset.style);
      });
      themeToggle.hidden = false;
    }
    if (styleToggle) {
      styleToggle.addEventListener('click', () => {
        const style = root.dataset.style === 'brutalist' ? 'print' : 'brutalist';
        savePreference(styleKey, style);
        applyAppearance(root.dataset.theme, style);
      });
      styleToggle.hidden = false;
    }
    applyAppearance(root.dataset.theme, root.dataset.style);
  }, { once: true });
})();
