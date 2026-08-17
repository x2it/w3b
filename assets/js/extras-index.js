/* ======================================================================
 * extras-index.js  —  index.html 专属的小交互集合
 *
 *   1) AI金句 打字机效果（多语言切换会自动重置）
 *   2) 邮箱一键复制（若DOM存在）
 *   3) 回到顶部按钮（若DOM存在）
 *   4) Banner 视差滚动 + 导航栏背景毛玻璃（若DOM存在）
 *   5) 侧边导航展开 / 折叠（若DOM存在）
 *   6) 章节锚点（nav-dots + scrollspy）（若DOM存在）
 *   7) 时间线滚入淡入（IntersectionObserver）（若DOM存在）
 *   8) 移动端禁用双击缩放（no-double-tap-zoom 元素）（若DOM存在）
 *   9) 博客 & 作品集 iframe 初始化 + 降级卡片切换（v3.0.0 新增）
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
    var el = document.getElementById('ai-quote-text') || document.getElementById('aiTypewriter');
    if (el) el.textContent = '';
    _tickTypewriter();
  }
  window._resetTypewriter = _resetTypewriter;

  function _tickTypewriter() {
    if (!twQuotes.length) return;
    var el = document.getElementById('ai-quote-text') || document.getElementById('aiTypewriter');
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
    var ban = document.getElementById('banner') || document.querySelector('header');
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
  // 9) v3.0.1 博客 & 作品集 iframe 初始化 + 降级卡片切换
  //
  // 降级策略（翻转：默认先显示 fallback，永远有可见内容）：
  //   - 启动时：立即隐藏 iframe 容器（height=0 / visibility:hidden），显示 fallback 卡片
  //   - 收到 iframe postMessage 含高度：确认成功才把 iframe 展开并隐藏 fallback
  //   - onerror / timeout / 一直无消息：fallback 一直显示，用户不会看到空白
  // ==================================================================
  function _showFallbackNow(containerId, fallbackId, iframeEl) {
    var c = document.getElementById(containerId);
    var f = document.getElementById(fallbackId);
    if (c) {
      c.classList.add('iframe-loading'); // 保持 CSS 里 visibility:hidden + height:0
      c.style.display = 'none';
    }
    if (f) {
      // 兜底：无论 fallback 初始 CSS 是什么，强制展开
      f.style.setProperty('display', 'grid', 'important');
      f.style.setProperty('visibility', 'visible', 'important');
      f.style.setProperty('opacity', '1', 'important');
    }
    if (iframeEl) { iframeEl.setAttribute('aria-hidden', 'true'); }
  }
  function _showIframe(containerId, fallbackId, iframeEl, height) {
    var c = document.getElementById(containerId);
    var f = document.getElementById(fallbackId);
    if (iframeEl && typeof height === 'number' && height > 0) {
      iframeEl.style.height = Math.floor(height) + 'px';
      iframeEl.height = String(Math.floor(height));
    }
    if (c) {
      c.classList.remove('iframe-loading');
      c.style.display = '';
      c.style.visibility = '';
    }
    if (f) {
      // iframe 成功 → 隐藏 fallback
      f.style.setProperty('display', 'none');
      f.style.setProperty('visibility', 'hidden');
      f.style.setProperty('opacity', '0');
    }
  }

  function _wireIframeEmbed(iframeId, containerId, fallbackId, timeoutMs) {
    var iframe = document.getElementById(iframeId);
    var fallbackEl = document.getElementById(fallbackId);
    // v3.0.1：立刻先显示 fallback —— 保证加载过程永远"不是空白"
    _showFallbackNow(containerId, fallbackId, iframe);
    if (!iframe) return;

    var resolved = false;
    var timer = setTimeout(function () {
      if (resolved) return;
      // 12 秒没收到 resize → 保持 fallback，清理 timer
      resolved = true;
      // 如果之前的 _showFallbackNow 失效（比如被别的逻辑改回），这里再次确保
      _showFallbackNow(containerId, fallbackId, iframe);
    }, timeoutMs || 12000);

    iframe.addEventListener('error', function () {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      _showFallbackNow(containerId, fallbackId, iframe);
    });

    window.addEventListener('message', function (ev) {
      if (resolved) return;
      try {
        var src = (iframe.contentWindow && iframe.contentWindow === ev.source);
        if (!src) return;
        var d = ev.data || {};
        if (typeof d === 'string') {
          try { d = JSON.parse(d); } catch (_) { d = {}; }
        }
        var h = null;
        if (d && typeof d.height === 'number') h = d.height;
        else if (d && d.data && typeof d.data.height === 'number') h = d.data.height;
        else if (d && typeof d.value === 'number' && (d.type === 'height' || typeof d.event === 'undefined')) h = d.value;
        if (h && h > 0 && h < 30000) {
          resolved = true;
          clearTimeout(timer);
          _showIframe(containerId, fallbackId, iframe, h);
        }
      } catch (_) {}
    });
  }

  function _initEmbeds() {
    _wireIframeEmbed('blog-embed',    'blogIframeContainer',    'blogFallback',    12000);
    _wireIframeEmbed('qmeow-embed',  'projectIframeContainer', 'projectFallback', 15000);
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
    _initEmbeds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
