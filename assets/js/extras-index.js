/* ======================================================================
 * extras-index.js  —  index.html 专属的小交互集合
 *
 *   1) AI金句 打字机效果（多语言切换会自动重置）
 *   2) 邮箱一键复制
 *   3) 回到顶部按钮
 *   4) Banner 视差滚动 + 导航栏背景毛玻璃
 *   5) 侧边导航展开 / 折叠
 *   6) 章节锚点（nav-dots + scrollspy）
 *   7) 时间线滚入淡入（IntersectionObserver）
 *   8) 移动端禁用双击缩放（no-double-tap-zoom 元素）
 *   9) 链接 hover 下划线动画（已通过 CSS 完成，此处为兼容降级）
 * ==================================================================== */
(function () {
  'use strict';

  // ---------- 1. AI金句 打字机 ----------
  var typewriterTimer = null;
  var twIndex = 0;
  var twChar  = 0;
  var twQuotes = [];

  function _loadQuotes() {
    var out = [];
    if (typeof window.t !== 'function') return out;
    for (var i = 1; i <= 16; i++) {
      var q = window.t('aiQuotes.q' + i);
      if (q) out.push(q);
    }
    return out.length ? out : [
      '理性是罗盘，情感是风帆，缺一不可。',
      '你看待世界的方式，塑造你的世界。'
    ];
  }

  function _resetTypewriter() {
    if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
    twIndex = 0; twChar = 0;
    twQuotes = _loadQuotes();
    var el = document.getElementById('aiTypewriter');
    if (el) el.textContent = '';
    _tickTypewriter();
  }
  window._resetTypewriter = _resetTypewriter;

  function _tickTypewriter() {
    if (!twQuotes.length) return;
    var el = document.getElementById('aiTypewriter');
    if (!el) return;
    var cur = twQuotes[twIndex] || '';
    if (twChar <= cur.length) {
      el.textContent = cur.substring(0, twChar);
      twChar++;
    } else {
      twIndex = (twIndex + 1) % twQuotes.length;
      twChar = 0;
      el.textContent = '';
    }
  }

  function _startTypewriter() {
    twQuotes = _loadQuotes();
    _tickTypewriter();
    typewriterTimer = setInterval(function () {
      if (document.hidden) return;
      _tickTypewriter();
    }, 180);
  }

  // ---------- 2. 邮箱复制 ----------
  function _wireEmailCopy() {
    var btn = document.getElementById('copyEmailBtn');
    var emailEl = document.getElementById('contactEmail');
    if (!btn || !emailEl) return;
    btn.addEventListener('click', function () {
      var email = emailEl.getAttribute('data-email') || emailEl.textContent || '';
      if (!email) return;
      var done = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () { done = true; _flashEmail(btn, true); })
          .catch(function () { _fallbackCopy(email, btn); });
      } else {
        _fallbackCopy(email, btn);
      }
    });
  }
  function _fallbackCopy(text, btn) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      _flashEmail(btn, true);
    } catch (_) { _flashEmail(btn, false); }
  }
  function _flashEmail(btn, ok) {
    var originalText = btn.getAttribute('data-text') || '';
    if (!originalText) { originalText = btn.textContent; btn.setAttribute('data-text', originalText); }
    btn.textContent = ok ? (typeof window.t === 'function' ? window.t('email.copied') || '✓ Copied' : '✓ Copied')
                         : (typeof window.t === 'function' ? window.t('email.copyFail') || '× Failed' : '× Failed');
    btn.classList.add(ok ? 'copy-ok' : 'copy-fail');
    setTimeout(function () {
      btn.textContent = originalText;
      btn.classList.remove('copy-ok', 'copy-fail');
    }, 1600);
  }

  // ---------- 3. 回到顶部 ----------
  function _wireBackToTop() {
    var btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    function _onScroll() {
      if (window.scrollY > 600) btn.classList.add('show');
      else btn.classList.remove('show');
    }
    window.addEventListener('scroll', _onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    _onScroll();
  }

  // ---------- 4. 视差 / 导航栏毛玻璃 ----------
  function _wireParallax() {
    var ban = document.getElementById('banner');
    var nav = document.getElementById('mainNav');
    if (!ban && !nav) return;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (ban) ban.style.backgroundPositionY = (y * 0.5) + 'px';
      if (nav) {
        if (y > 32) nav.classList.add('scrolled');
        else        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ---------- 5. 侧边导航 ----------
  function _wireSideNav() {
    var open  = document.getElementById('sideNavOpen');
    var close = document.getElementById('sideNavClose');
    var nav   = document.getElementById('sideNav');
    if (!nav) return;
    if (open)  open.addEventListener('click',  function () { nav.classList.add('open'); });
    if (close) close.addEventListener('click', function () { nav.classList.remove('open'); });
    // 点击遮罩层或链接后关闭
    nav.addEventListener('click', function (e) {
      if (e.target === nav || e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  // ---------- 6. 章节锚点 + scrollspy ----------
  function _wireNavDots() {
    var dots = document.querySelectorAll('#navDots .nav-dot');
    if (!dots.length) return;
    var sectionIds = [];
    dots.forEach(function (d) {
      var id = d.getAttribute('data-section');
      if (id) sectionIds.push(id);
      d.addEventListener('click', function (e) {
        e.preventDefault();
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          dots.forEach(function (d) {
            d.classList.toggle('active', d.getAttribute('data-section') === id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sectionIds.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  // ---------- 7. 时间线滚入淡入 ----------
  function _wireTimelineObserver() {
    var items = document.querySelectorAll('.timeline-item');
    if (!items.length || !('IntersectionObserver' in window)) {
      // 不支持 IO 则直接全部展示
      items.forEach(function (i) { i.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    items.forEach(function (it) { io.observe(it); });
  }

  // ---------- 8. 移动端禁用双击缩放 ----------
  function _wireNoDoubleTapZoom() {
    var lastTouch = 0;
    var list = document.querySelectorAll('.no-double-tap-zoom');
    list.forEach(function (el) {
      el.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTouch <= 320) e.preventDefault();
        lastTouch = now;
      }, { passive: false });
    });
  }

  // ==================================================================
  // 初始化
  // ==================================================================
  function init() {
    _startTypewriter();
    _wireEmailCopy();
    _wireBackToTop();
    _wireParallax();
    _wireSideNav();
    _wireNavDots();
    _wireTimelineObserver();
    _wireNoDoubleTapZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
