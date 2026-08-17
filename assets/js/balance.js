/* ======================================================================
 * balance.js  —  知 / 行 双滑块 + 杠杆平衡可视化
 *
 * DOM（均为可选，缺失则对应功能静默失效）：
 *   - #knowledgeSlider (知，0-100)  /  #actionSlider (行，0-100)
 *   - #knowledgeValue 显示 % 值 / #actionValue 显示 % 值
 *   - #balanceState 状态文案（默认三语翻译：balance.equal / balance.knowMore /
 *     balance.actionMore / balance.knowHeavy / balance.actionHeavy）
 *   - #balanceBeam 杠杆横梁（transform: rotate 控制倾斜）
 *   - #weightKnow  知砝码（translateX 左移）
 *   - #weightAction 行砝码（translateX 右移）
 *
 * 主题切换：监听 themeChanged 事件刷新强调色。
 * 三语切换：window._resetBalanceText() 重新翻译状态文案。
 * ==================================================================== */
(function () {
  'use strict';

  var state = { know: 0.5, action: 0.5 };

  function t(k, fallback) {
    if (typeof window.t !== 'function') return fallback || '';
    var v = window.t(k);
    return v || fallback || '';
  }

  function _getVal(id, def) {
    var s = document.getElementById(id);
    if (!s) return def;
    var v = parseFloat(s.value || String(def * 100));
    if (isNaN(v)) v = def * 100;
    return Math.max(0, Math.min(100, v)) / 100;
  }
  function _setVal(id, v) {
    var s = document.getElementById(id);
    if (s) s.value = String(Math.round(v * 100));
  }
  function _setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(Math.round(val * 100));
  }
  function _accentRgb() {
    try {
      var v = getComputedStyle(document.body).getPropertyValue('--accent-rgb').trim();
      if (v) return v;
    } catch (_) {}
    return '99, 102, 241';
  }

  function renderState() {
    var k = state.know, a = state.action;
    _setText('knowledgeValue', k);
    _setText('actionValue', a);

    // 杠杆：横梁倾斜角度。k=a → 0°；k=1 → -12°；a=1 → +12°
    var beam = document.getElementById('balanceBeam');
    if (beam) {
      var deg = (a - k) * 12;
      beam.style.setProperty('transform', 'translate(-50%, -50%) rotate(' + deg.toFixed(2) + 'deg)');
      beam.style.setProperty('transform-origin', '50% 50%');
      beam.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)');
    }
    // 砝码位置：左侧知砝码随知强度左移，右侧行砝码随行强度右移
    var wk = document.getElementById('weightKnow');
    if (wk) {
      var x = (-k * 70).toFixed(1);
      wk.style.setProperty('transform', 'translate(-50%, -50%) translateX(' + x + '%)');
      wk.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)');
    }
    var wa = document.getElementById('weightAction');
    if (wa) {
      var x2 = (a * 70).toFixed(1);
      wa.style.setProperty('transform', 'translate(-50%, -50%) translateX(' + x2 + '%)');
      wa.style.setProperty('transition', 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)');
    }
    // 状态文案
    var st = document.getElementById('balanceState');
    if (st) {
      var sum = k + a;
      var key;
      if (sum === 0) key = 'balance.equal';
      else if (Math.abs(k - a) < 0.08) key = 'balance.equal';
      else if (k > a) {
        key = (k - a > 0.35) ? 'balance.knowHeavy' : 'balance.knowMore';
      } else {
        key = (a - k > 0.35) ? 'balance.actionHeavy' : 'balance.actionMore';
      }
      var labelKnow = t('balance.know', '知');
      var labelAct  = t('balance.action', '行');
      var tmpl = t(key, '');
      if (tmpl) {
        st.textContent = tmpl
          .replace('{k}', String(Math.round(k * 100)))
          .replace('{a}', String(Math.round(a * 100)))
          .replace('{知}', labelKnow)
          .replace('{行}', labelAct);
      }
    }
  }

  window._updateBalanceVisualColors = function() { _updateVisualColors(); };
  function _updateVisualColors() {
    var acc = _accentRgb();
    var accentColor = 'rgb(' + acc + ')';
    ['weightKnow','weightAction'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.setProperty('background', accentColor);
      el.style.setProperty('box-shadow', '0 4px 14px rgba(' + acc + ', 0.35)');
    });
    var beam = document.getElementById('balanceBeam');
    if (beam) beam.style.setProperty('background', accentColor);
    var st = document.getElementById('balanceState');
    if (st) st.style.setProperty('color', accentColor);
    var rangeLabels = document.querySelectorAll('.balance-section input[type="range"]');
    for (var i = 0; i < rangeLabels.length; i++) {
      rangeLabels[i].style.setProperty('--thumb-bg', accentColor);
    }
  }

  function syncFromSliders() {
    state.know   = _getVal('knowledgeSlider', 0.5);
    state.action = _getVal('actionSlider',    0.5);
    renderState();
  }

  function _wire(id) {
    var s = document.getElementById(id);
    if (!s) return;
    s.addEventListener('input', syncFromSliders);
  }

  function init() {
    _setVal('knowledgeSlider', state.know);
    _setVal('actionSlider',    state.action);
    _wire('knowledgeSlider');
    _wire('actionSlider');
    syncFromSliders();
    _updateVisualColors();

    document.addEventListener('themeChanged', function () {
      _updateVisualColors();
    });
  }

  window._resetBalanceText = renderState;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
