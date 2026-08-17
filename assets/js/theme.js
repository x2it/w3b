/* ======================================================================
 * theme.js  —  主题系统核心模块（v3.0.0 拆分）
 *
 * 设计原则：CSS 为主题配色的唯一真源 (SSOT)。
 *   - 本文件不再硬编码 7×13 的 THEME_VARS 表（此前与 style.css 双份维护）。
 *   - syncRootVars() 在 body 设置完主题 class 后，
 *     通过 getComputedStyle(body) 实时读取 CSS 变量，再同步写入
 *     documentElement.style（全局装饰层：粒子背景、viewport vignette 从此取色）。
 * ==================================================================== */
(function () {
  'use strict';

  var THEME_KEYS = [
    '--bg-color', '--bg-gradient',
    '--text-color', '--text-secondary', '--text-light', '--dark-color',
    '--accent-color', '--accent-rgb', '--accent-secondary',
    '--border-color', '--card-bg', '--card-shadow', '--card-shadow-hover'
  ];

  var THEME_CLASSES = [
    'light-mode', 'default-mode', 'serif_dark-mode',
    'dark-mode',
    'blue-mode', 'green-mode', 'purple-mode', 'orange-mode',
    'teal-mode', 'cyan-mode'
  ];

  window.cachedAccentRgb = '99, 102, 241';
  window.cachedTextRgb = '31, 41, 55';

  function hexToRgb(hex) {
    hex = (hex || '').toString().replace(/^#/, '');
    if (!hex) return '99, 102, 241';
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (hex.length >= 8) hex = hex.substring(0, 6);
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '99, 102, 241';
    return r + ', ' + g + ', ' + b;
  }

  function updateCachedColors() {
    var cs = getComputedStyle(document.body);
    window.cachedAccentRgb = hexToRgb(cs.getPropertyValue('--accent-color').trim());
    window.cachedTextRgb = hexToRgb(cs.getPropertyValue('--text-color').trim());
  }
  window.updateCachedColors = updateCachedColors;

  function syncRootVars(themeName) {
    var root = document.documentElement;
    var body = document.body;
    var i, k, v;
    if (themeName === 'system') {
      for (i = 0; i < THEME_KEYS.length; i++) {
        root.style.removeProperty(THEME_KEYS[i]);
      }
      return;
    }
    var cs = getComputedStyle(body);
    for (i = 0; i < THEME_KEYS.length; i++) {
      k = THEME_KEYS[i];
      v = cs.getPropertyValue(k).trim();
      if (v) root.style.setProperty(k, v);
      else root.style.removeProperty(k);
    }
  }
  window.syncRootVars = syncRootVars;

  function themeToStyle(theme, resolvedDark) {
    if (theme === 'light') return 'classic';
    if (theme === 'system') return resolvedDark ? 'philosophic' : 'classic';
    if (theme === 'blue' || theme === 'purple' || theme === 'teal') return 'studio';
    if (theme === 'dark' || theme === 'green' || theme === 'orange') return 'philosophic';
    return 'classic';
  }
  window.themeToStyle = themeToStyle;

  function applyTheme(theme) {
    var body = document.body;
    body.classList.remove.apply(body.classList, THEME_CLASSES);

    var raw = (theme || 'system').toString();
    if (raw === 'cyan') raw = 'teal';
    else if (raw === 'default' || raw === 'serif_dark') raw = 'light';

    var opts = document.querySelectorAll('.theme-option');
    opts.forEach(function (o) {
      o.classList.remove('active');
      if (o.getAttribute('data-theme') === raw) o.classList.add('active');
    });

    var resolvedDark = false;
    var t = raw;
    if (t === 'dark')       { body.classList.add('dark-mode');  resolvedDark = true; }
    else if (t === 'light')   body.classList.add('light-mode');
    else if (t === 'blue')    body.classList.add('blue-mode');
    else if (t === 'green') { body.classList.add('green-mode'); resolvedDark = true; }
    else if (t === 'purple')  body.classList.add('purple-mode');
    else if (t === 'orange'){ body.classList.add('orange-mode');resolvedDark = true; }
    else if (t === 'teal')    body.classList.add('teal-mode');
    else if (t === 'system') {
      resolvedDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(resolvedDark ? 'dark-mode' : 'light-mode');
    }

    body.setAttribute('data-theme-style', themeToStyle(t, resolvedDark));
    syncRootVars(t);

    try { localStorage.setItem('theme', t); } catch (_) {}

    if (typeof window.updateBalanceColors === 'function') window.updateBalanceColors();
    updateCachedColors();
    if (typeof window._onThemeChanged === 'function') window._onThemeChanged();
    document.dispatchEvent(new Event('themeChanged'));
  }
  window.applyTheme = applyTheme;

  function updateBalanceColors() {
    var weights = document.querySelectorAll('.weight');
    if (weights.length === 0) return;
    var accent = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
    weights.forEach(function (w) {
      w.style.background = accent;
      w.style.boxShadow = '0 4px 12px rgba(' + (window.cachedAccentRgb || '99,102,241') + ', 0.25)';
    });
    if (typeof window.updateBalance === 'function') window.updateBalance();
  }
  window.updateBalanceColors = updateBalanceColors;

  function wireThemeMenu() {
    var toggle = document.getElementById('themeToggle') || document.getElementById('themeBtn');
    var menu   = document.getElementById('themeMenu')   || document.getElementById('themePanel');
    var opts   = document.querySelectorAll('.theme-option');

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        menu.classList.toggle('show');
      });
      document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('show');
        }
      });
    }
    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var th = opt.getAttribute('data-theme');
        if (th) applyTheme(th);
      });
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var cur = 'system';
    try { cur = localStorage.getItem('theme') || 'system'; } catch (_) {}
    if (cur === 'system') applyTheme('system');
    else if (typeof window.updateBalanceColors === 'function') window.updateBalanceColors();
  });

  function init() {
    wireThemeMenu();
    var saved = 'system';
    try { saved = localStorage.getItem('theme') || 'system'; } catch (_) {}
    applyTheme(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
