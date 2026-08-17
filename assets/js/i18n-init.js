/* ======================================================================
 * i18n-init.js  —  三语初始化 + 语言菜单（v3.0.0 拆分自 index/about/404 内联脚本）
 *
 * 前置依赖：assets/js/i18n.js（其中定义 window.I18N = { zh, zh-TW, en } 词典）
 * 全局暴露：window.t(key)    取翻译
 *           window.i18n.t    同上，便于外部脚本
 *           window.setLang   手动切换语言（会持久化 localStorage）
 * ==================================================================== */
(function () {
  'use strict';

  // ---------- 安全读 localStorage（兼容隐私模式 / Safari 禁用存储） ----------
  var savedLang = null;
  try { savedLang = localStorage.getItem('w3b_lang'); } catch (_) {}

  // ---------- 语言自动检测 ----------
  var candidateLang = '';
  try {
    if (window.navigator.languages && window.navigator.languages.length) {
      candidateLang = String(window.navigator.languages[0] || '');
    }
  } catch (_) {}
  if (!candidateLang) {
    try { candidateLang = String(navigator.language || ''); } catch (_) {}
  }
  candidateLang = candidateLang.replace(/_/g, '-');

  var autoLang;
  if (/^zh(-|$)/i.test(candidateLang)) {
    autoLang = /(TW|HK|MO|Hant)/i.test(candidateLang) ? 'zh-TW' : 'zh';
  } else {
    autoLang = 'en';
  }

  var currentLang = savedLang || autoLang;

  // 首屏立即写 html lang（避免搜索引擎误判 + 减少语言闪烁）
  (function syncHtmlLangEarly() {
    var hl = currentLang === 'zh-TW' ? 'zh-TW' : currentLang === 'en' ? 'en' : 'zh-CN';
    document.documentElement.lang = hl;
  })();

  var I18N = window.I18N || null;
  var i18nReady = !!(I18N && I18N.zh);

  function t(key) {
    if (!i18nReady) return null;
    try {
      var dict = I18N[currentLang] || I18N['zh'];
      if (dict && dict[key]) return dict[key];
      if (I18N['zh'] && I18N['zh'][key]) return I18N['zh'][key];
      return null;
    } catch (_) { return null; }
  }
  window.t = t;
  window.i18n = { t: t };

  function applyI18n() {
    if (!i18nReady) return;
    try {
      var hl = currentLang === 'zh-TW' ? 'zh-TW' : currentLang === 'en' ? 'en' : 'zh-CN';
      document.documentElement.lang = hl;

      // og:locale
      var ogLocale = document.querySelector('meta[property="og:locale"]');
      if (ogLocale) ogLocale.setAttribute('content', hl.replace('-', '_'));

      // og:locale alternate (hreflang)
      var alternates = document.querySelectorAll('meta[property="og:locale:alternate"]');
      // (无需重写，值是固定的三语列表)

      // JSON-LD inLanguage / 可翻译字段
      var ldScript = document.getElementById('ld-json');
      if (ldScript) {
        try {
          var ldData = JSON.parse(ldScript.textContent);
          var n = t('ld.name'), d = t('ld.description'), a = t('ld.author');
          if (n) ldData.name = n;
          if (d) ldData.description = d;
          if (a && ldData.author) ldData.author.name = a;
          ldData.inLanguage = hl;
          ldScript.textContent = JSON.stringify(ldData, null, 4);
        } catch (_) {}
      }

      // data-i18n: textContent
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n'));
        if (v !== null) el.textContent = v;
      });

      // data-i18n-html: innerHTML（用于富文本说明，如 about.html 文档表格）
      document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n-html'));
        if (v !== null) el.innerHTML = v;
      });

      // data-i18n-content: meta content 属性
      document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n-content'));
        if (v !== null) el.setAttribute('content', v);
      });

      // data-i18n-title: title 属性 / aria-label（同时支持 data-i18n-aria）
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n-title'));
        if (v !== null) el.setAttribute('title', v);
      });
      document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n-aria'));
        if (v !== null) el.setAttribute('aria-label', v);
      });

      // document.title 页面专属 key
      var titleKey = null;
      if (document.body && document.body.id === 'page-404') titleKey = '404.meta.title';
      else if (document.body && document.body.id === 'page-about') titleKey = 'about.meta.title';
      else titleKey = 'meta.title';
      var titleText = t(titleKey);
      if (titleText) document.title = titleText;

      // 通知其他模块
      if (typeof window.updateBalance === 'function') window.updateBalance();
      if (typeof window._resetTypewriter === 'function') window._resetTypewriter();
      if (typeof window._refreshParticleDesc === 'function') window._refreshParticleDesc();
    } catch (e) { /* i18n 异常不应阻塞页面运行 */ }
  }
  window.applyI18n = applyI18n;

  // ---------- 语言菜单 ----------
  function wireLangMenu() {
    var langToggle = document.getElementById('langToggle');
    var langMenu   = document.getElementById('langMenu');
    var langOptions = document.querySelectorAll('[data-lang]');

    function markActive() {
      langOptions.forEach(function (o) {
        o.classList.remove('active');
        if (o.getAttribute('data-lang') === currentLang) o.classList.add('active');
      });
    }

    if (langToggle && langMenu) {
      langToggle.addEventListener('click', function () {
        langMenu.classList.toggle('show');
      });
      document.addEventListener('click', function (e) {
        if (!langToggle.contains(e.target) && !langMenu.contains(e.target)) {
          langMenu.classList.remove('show');
        }
      });
    }
    langOptions.forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.preventDefault();
        var l = opt.getAttribute('data-lang');
        if (l) setLang(l);
        // 关闭菜单
        if (langMenu) langMenu.classList.remove('show');
      });
    });
    markActive();
  }

  function setLang(lang) {
    if (!/^(zh|zh-TW|en)$/.test(lang)) lang = 'zh';
    currentLang = lang;
    try { localStorage.setItem('w3b_lang', lang); } catch (_) {}
    applyI18n();
    // 重新标记菜单 active（applyI18n 不负责菜单 DOM）
    var langOptions = document.querySelectorAll('[data-lang]');
    langOptions.forEach(function (o) {
      o.classList.remove('active');
      if (o.getAttribute('data-lang') === currentLang) o.classList.add('active');
    });
  }
  window.setLang = setLang;

  // ---------- 初始化 ----------
  function init() {
    wireLangMenu();
    applyI18n();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
