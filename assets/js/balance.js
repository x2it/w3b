/* ======================================================================
 * balance.js  —  知识 / 情感 / 经济 三维平衡条
 *
 *   - 从 #knowledgeSlider / #balanceSlider（旧兼容） 读数
 *   - 自动更新 window.STATE 与 data-* 进度属性（用于 CSS 渐变条）
 *   - 文案通过 window.t() 取三语翻译，切语言时 i18n-init.js 会调用
 *     window.updateBalance() 重新渲染。
 *   - updateBalanceColors() 读 CSS 变量，渲染滑块与进度条视觉。
 *
 *  注意：文件同时在 index.html / 404.html / about.html 中复用。
 *        某些控件仅在特定页面存在（如 about.html 没有知识滑块），
 *        因此所有 DOM 查询均做空值保护。
 * ==================================================================== */
(function () {
  'use strict';

  // window.STATE 为公开句柄，便于其他代码（例如历史粒子状态）读取
  if (!window.STATE) {
    window.STATE = { 知识: 0.4, 情感: 0.3, 经济: 0.3 };
  }

  function getSliderValue() {
    try {
      var s1 = document.getElementById('knowledgeSlider');
      if (s1) return parseFloat(s1.value || '0') / 100;
      var s2 = document.getElementById('balanceSlider');
      if (s2) return parseFloat(s2.value || '0') / 100;
    } catch (_) {}
    return 0.4;
  }

  function setSliderValue(v) {
    var s1 = document.getElementById('knowledgeSlider');
    if (s1) s1.value = String(Math.round(v * 100));
    var s2 = document.getElementById('balanceSlider');
    if (s2) s2.value = String(Math.round(v * 100));
  }

  function _pickLabel(key) {
    if (typeof window.t !== 'function') return key;
    var translated = window.t('state.' + key);
    return translated || key;
  }

  function _pickStatusText(k) {
    if (typeof window.t !== 'function') return '';
    if (k < 0.2)  return window.t('balance.status.risk') || '';
    if (k <= 0.6) return window.t('balance.status.balanced') || '';
    return window.t('balance.status.bias') || '';
  }

  function _updateAttrs() {
    var S = window.STATE;
    var k = (S.知识 || 0);
    var e = (S.情感 || 0);
    var j = (S.经济 || 0);
    var list = document.querySelectorAll('[data-progress]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var dim = el.getAttribute('data-progress');
      var val = 0;
      if (dim === 'knowledge' || dim === '知识') val = k;
      else if (dim === 'emotion' || dim === '情感') val = e;
      else if (dim === 'economy' || dim === '经济') val = j;
      else if (dim === 'total' || dim === '总和') val = k + e + j;
      el.setAttribute('data-progress-value', val.toFixed(2));
      el.style.setProperty('--bar', Math.max(0, Math.min(1, val)));
    }
  }

  function updateBalance() {
    var k = getSliderValue();
    if (isNaN(k)) k = 0.4;
    var rest = 1 - k;
    var emo = (Math.round(rest * 0.5 * 100)) / 100;
    var eco = (Math.round((rest - emo) * 100)) / 100;
    // 保证三者之和精确为 1（0.00 精度）
    if (Math.abs(k + emo + eco - 1) > 1e-6) {
      eco = Math.round((1 - k - emo) * 100) / 100;
    }
    window.STATE = { 知识: k, 情感: emo, 经济: eco };

    var b = document.getElementById('balanceSummary');
    if (b && typeof window.t === 'function') {
      var kk = _pickLabel('知识');
      var ee = _pickLabel('情感');
      var jj = _pickLabel('经济');
      var status = _pickStatusText(k);
      var tmpl = window.t('balance.summary');
      if (tmpl) {
        b.textContent = tmpl
          .replace('{知识}', kk).replace('{情感}', ee).replace('{经济}', jj)
          .replace('{k}', Math.round(k * 100))
          .replace('{e}', Math.round(emo * 100))
          .replace('{j}', Math.round(eco * 100))
          .replace('{status}', status);
      }
    }

    _updateAttrs();
  }
  window.updateBalance = updateBalance;

  function updateBalanceColors() {
    try {
      var cs = getComputedStyle(document.body);
      var acc = cs.getPropertyValue('--accent-rgb').trim() || '99, 102, 241';
      var bar = cs.getPropertyValue('--bar-track-rgb').trim() || '229, 231, 235';

      // 滑块轨道
      var styles = document.querySelectorAll('[data-progress-style]');
      for (var i = 0; i < styles.length; i++) {
        styles[i].style.setProperty('--accent-rgb', acc);
        styles[i].style.setProperty('--bar-track-rgb', bar);
      }

      // 滑块拇指
      var sliders = document.querySelectorAll('input[type="range"].knowledge-slider');
      for (var j = 0; j < sliders.length; j++) {
        var s = sliders[j];
        s.style.setProperty('--thumb-bg', 'rgb(' + acc + ')');
      }

      var summary = document.getElementById('balanceSummary');
      if (summary) summary.style.color = 'rgb(' + acc + ')';
    } catch (_) {}
  }
  window.updateBalanceColors = updateBalanceColors;

  // ---------- 监听滑块输入 ----------
  function _wireSlider(id) {
    var s = document.getElementById(id);
    if (!s) return;
    s.addEventListener('input', function () {
      updateBalance();
    });
  }

  function init() {
    _wireSlider('knowledgeSlider');
    _wireSlider('balanceSlider');
    setSliderValue(window.STATE.知识 || 0.4);
    updateBalance();
    updateBalanceColors();

    // 主题切换后重新取颜色
    document.addEventListener('themeChanged', function () {
      updateBalanceColors();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
