/* AP GUPPY WORLD — config
 * Paste your deployed Google Apps Script /exec URL below,
 * OR set it from the in-app Settings page (saved to this browser).
 */
window.CONFIG = {
  // Leave empty to run in Demo Mode. Settings page can override this.
  DEFAULT_API_URL: "",
  STORAGE_KEY: "apgw_api_url"
};

window.getApiUrl = function () {
  try {
    var saved = localStorage.getItem(window.CONFIG.STORAGE_KEY);
    if (saved) return saved.trim();
  } catch (e) {}
  return (window.CONFIG.DEFAULT_API_URL || "").trim();
};

window.setApiUrl = function (url) {
  try { localStorage.setItem(window.CONFIG.STORAGE_KEY, (url || "").trim()); } catch (e) {}
};

window.clearApiUrl = function () {
  try { localStorage.removeItem(window.CONFIG.STORAGE_KEY); } catch (e) {}
};

window.isLive = function () { return !!window.getApiUrl(); };
