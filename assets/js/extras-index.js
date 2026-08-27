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
      items.forEach(function (i) { i.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
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
  // 9) v3.0.2 → v3.3.0 博客 & 作品集 iframe 初始化 + 降级卡片切换
  //
  // 策略（默认显示 iframe，失败才降级）：
  //   - 启动时：iframe 容器默认可见 + 根据「嵌入类型 × 当前视口」给出合适默认高度
  //   - iframe onload：保持显示；若有 postMessage 高度，会夹紧到 [minH, maxH] 区间后再应用
  //   - iframe onerror / 超时：隐藏 iframe，显示 fallback 金句卡片
  //   - window resize：移动端/桌面端切换时，按新视口重新夹紧高度（避免横→竖屏切后博客被截断）
  // ==================================================================

  /* ---------- 响应式断点与嵌入配置 ---------- */
  var MOBILE_BP  = 768;   // ≤768px 视为移动端（与 CSS 保持一致）
  var SMALL_BP   = 480;   // ≤480px 小屏
  function _isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }
  function _isSmall() {
    return window.innerWidth <= SMALL_BP;
  }

  /* 每个嵌入的默认高度区间（单位 px）。
     博客（10 篇竖向卡片 + header + CTA）：
       桌面：标题 + 10 卡 + 间距 + CTA ≈ 950（实测截图），兜底 min=970 / 默认=1070 / 允许上游+新增到 1520（桌面+20 手机-20 第三轮微调）
       移动 ≤768：窄屏卡片更高 ≈ 1200，min=1180 / 默认=1280 / 上限 1680
       小屏 ≤480：文字更紧凑但换行稍多 ≈ 1250，min=1230 / 默认=1330 / 上限 1780
       ⚠ min 设为「真实高度 + 50」即可，不能再高——min 超过真实值会硬撑出底部空白
     项目（12 宫格卡片 + 入口按钮）：
       桌面：3 列 × 4 行实际只需 ~650，封顶 820 避免底下大片空白
       移动：用户反馈「够用」，保持 950 左右 */
  var EMBED_CONFIGS = {
    'blog-embed': {
      desktop: { default: 1070, min: 970,  max: 1520 },
      mobile:  { default: 1280, min: 1180, max: 1680 },
      small:   { default: 1330, min: 1230, max: 1780 }
    },
    'qmeow-embed': {
      desktop: { default: 780,  min: 620,  max: 820 },
      mobile:  { default: 950,  min: 850,  max: 1200 },
      small:   { default: 980,  min: 880,  max: 1250 }
    }
  };

  function _getEmbedCfg(iframeId) {
    var cfg = EMBED_CONFIGS[iframeId];
    if (!cfg) return { default: 1000, min: 500, max: 30000 };
    if (_isSmall())  return cfg.small;
    if (_isMobile()) return cfg.mobile;
    return cfg.desktop;
  }

  function _clampHeight(iframeId, h) {
    var cfg = _getEmbedCfg(iframeId);
    var x = (typeof h === 'number' && h > 0) ? Math.floor(h) : cfg.default;
    if (x < cfg.min) x = cfg.min;
    if (x > cfg.max) x = cfg.max;
    return x;
  }

  function _showFallback(containerId, fallbackId) {
    var c = document.getElementById(containerId);
    var f = document.getElementById(fallbackId);
    var iframe = c ? c.querySelector('iframe') : null;
    if (c) {
      c.classList.add('iframe-loading');
      c.style.display = 'none';
    }
    if (iframe) {
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
    }
    if (f) {
      f.style.setProperty('display', 'grid', 'important');
      f.style.setProperty('visibility', 'visible', 'important');
      f.style.setProperty('opacity', '1', 'important');
      f.style.setProperty('min-height', '300px', 'important');
    }
  }
  /* 当前每个 iframe 最后一次成功应用的「原始高度」（来自 postMessage），
     resize 时用它重新夹紧，避免桌面↔移动断点切换后高度不对。 */
  var _lastHeights = {}; // { iframeId: rawHeightNumber }
  var _resizeTimer = null;

  function _applyHeightNow(iframeId, containerId, fallbackId, iframe, rawHeight) {
    var c = document.getElementById(containerId);
    var f = document.getElementById(fallbackId);
    // 夹紧：结合当前视口与该嵌入的区间配置
    var h = _clampHeight(iframeId, rawHeight);
    if (iframe) {
      iframe.style.height = h + 'px';
      iframe.style.width = '100%';
      iframe.style.display = 'block';
      iframe.style.visibility = 'visible';
      iframe.height = String(h);
    }
    if (c) {
      c.classList.remove('iframe-loading');
      c.style.display = '';
      c.style.visibility = '';
      c.style.minHeight = '200px';
    }
    if (f) {
      f.style.setProperty('display', 'none', 'important');
      f.style.setProperty('visibility', 'hidden', 'important');
      f.style.setProperty('opacity', '0', 'important');
    }
  }

  function _showIframe(containerId, fallbackId, iframe, height) {
    // 兼容旧调用：这里无法拿到 iframeId，退化为「拿到 iframe 元素 id」即可
    var iframeId = iframe ? iframe.id : '';
    _applyHeightNow(iframeId, containerId, fallbackId, iframe, height);
  }

  function _wireIframeEmbed(iframeId, containerId, fallbackId, timeoutMs) {
    var iframe = document.getElementById(iframeId);
    if (!iframe) return;

    var resolved = false;
    var container = document.getElementById(containerId);
    var fallbackEl = document.getElementById(fallbackId);
    var timer = null;

    // 在「注册阶段」就给 iframe 一个合理的初始值（避免首屏 HTML 里写死的 1000 先闪出不合适高度）
    // 不过这一步只是保险，真正的初始值仍然在 _initNow 里统一设置。
    var initCfg = _getEmbedCfg(iframeId);
    _lastHeights[iframeId] = initCfg.default;

    function _startTimer() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (resolved) return;
        resolved = true;
        _showFallback(containerId, fallbackId);
      }, timeoutMs || 20000);
    }

    function _initNow() {
      if (resolved) return;
      var cfg = _getEmbedCfg(iframeId);
      // 按当前视口取默认高度
      iframe.style.height = cfg.default + 'px';
      iframe.height = String(cfg.default);
      _lastHeights[iframeId] = cfg.default;
      if (container) {
        container.classList.remove('iframe-loading');
        container.style.display = '';
        container.style.visibility = '';
      }
      if (fallbackEl) {
        fallbackEl.style.setProperty('display', 'none');
        fallbackEl.style.setProperty('visibility', 'hidden');
      }
      _startTimer();
    }

    // 用 IntersectionObserver 延迟初始化：iframe 接近视口时才启动计时器
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            io.disconnect();
            _initNow();
          }
        });
      }, { rootMargin: '200px', threshold: 0.01 });
      io.observe(container || iframe);
    } else {
      _initNow();
    }

    // iframe 自身错误 → 立即降级
    iframe.addEventListener('error', function () {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      _showFallback(containerId, fallbackId);
    });

    // iframe 加载成功 → 视为成功，不再触发超时降级
    iframe.addEventListener('load', function () {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      // 没收到 postMessage 也没关系：我们已经在 _initNow 给了合适默认高度
    });

    // 监听 postMessage 获取动态高度（独立于 resolved 状态，始终响应）
    window.addEventListener('message', function (ev) {
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
        else if (d && typeof d.value === 'number' && (d.type === 'height')) h = d.value;
        if (h && h > 0 && h < 30000) {
          if (!resolved) {
            resolved = true;
            if (timer) clearTimeout(timer);
          }
          // 记录「原始高度」，resize 时会用它重新夹紧
          _lastHeights[iframeId] = h;
          _applyHeightNow(iframeId, containerId, fallbackId, iframe, h);
        }
      } catch (_) {}
    });

    // resize 防抖：桌面↔移动端跨越断点时，用最后一次 rawHeight 重新夹紧
    window.addEventListener('resize', function () {
      if (_resizeTimer) clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(function () {
        var raw = _lastHeights[iframeId];
        if (typeof raw !== 'number') return;
        // 只在「跨过断点」时重算，避免高频像素级抖动
        var need = false;
        var _lastBreakpoint = iframe._bp || '';
        var cur = _isSmall() ? 'S' : (_isMobile() ? 'M' : 'D');
        if (_lastBreakpoint && _lastBreakpoint !== cur) need = true;
        iframe._bp = cur;
        if (need || !iframe.style.height) {
          _applyHeightNow(iframeId, containerId, fallbackId, iframe, raw);
        }
      }, 120);
    }, { passive: true });
  }

  // ==================================================================
  // 嵌入内容主题同步（v3.2.1：让 iframe 明暗跟随 w3b 主题切换）
  // ==================================================================
  function _getEmbedThemeMode() {
    // 暗主题：body class 命中 dark/green/orange → 暗家族
    var darkModes = ['dark-mode', 'green-mode', 'orange-mode'];
    var lightModes = ['light-mode', 'blue-mode', 'purple-mode', 'teal-mode', 'cyan-mode'];
    var cls = document.body.className || '';
    for (var i = 0; i < darkModes.length; i++) {
      if (cls.indexOf(darkModes[i]) !== -1) return 'dark';
    }
    // 显式亮家族直接返回 light（避免 system 主题下 CSS 变量解析错误）
    for (var j = 0; j < lightModes.length; j++) {
      if (cls.indexOf(lightModes[j]) !== -1) return 'light';
    }
    // 其他所有（default/blue/purple/teal/cyan）都走 light
    // 也兜底用 CSS 变量 --text-color 亮度判断，防止遗漏
    try {
      var bg = getComputedStyle(document.body).getPropertyValue('--bg-color').trim();
      if (bg) {
        var m = bg.match(/#([0-9a-f]{6})/i);
        if (m) {
          var hex = m[1];
          var r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
          var lum = (0.299*r + 0.587*g + 0.114*b) / 255;
          if (lum < 0.35) return 'dark';
        }
      }
    } catch(_) {}
    return 'light';
  }

  function _updateIframeThemeParam(iframeId, themeKey) {
    var iframe = document.getElementById(iframeId);
    if (!iframe || !iframe.src) return;
    try {
      var url = new URL(iframe.src, location.href);
      var oldTheme = url.searchParams.get('theme') || '';
      if (oldTheme === themeKey) return; // 相同不重刷新
      url.searchParams.set('theme', themeKey);
      // 先 fade out，等 opacity 下来后再换 src 重加载 → fade in，避免白闪烁
      var originalTransition = iframe.style.transition || '';
      iframe.style.opacity = '0';
      iframe.style.visibility = 'hidden';
      setTimeout(function () {
        iframe.src = url.toString();
        // iframe onload 后再 fade in
        var fadeHandler = function () {
          iframe.removeEventListener('load', fadeHandler);
          iframe.style.visibility = 'visible';
          iframe.style.opacity = '1';
        };
        iframe.addEventListener('load', fadeHandler);
        // 兜底：500ms 后即使 load 没到也淡入（避免全白）
        setTimeout(function () {
          if (iframe.style.visibility === 'hidden') {
            fadeHandler();
          }
        }, 500);
      }, 300); // 等 opacity 动画差不多完成（0.35s 我们用 0.3s 切）
    } catch (_) {
      // 旧浏览器兜底：字符串替换
      var src = iframe.src;
      var re = /([?&])theme=[^&]*/;
      if (re.test(src)) iframe.src = src.replace(re, '$1theme=' + themeKey);
      else iframe.src += (src.indexOf('?') >= 0 ? '&' : '?') + 'theme=' + themeKey;
    }
  }

  function _updateProjectFilterMode() {
    // v3.2.7 实测确认：浏览器跨域 iframe 的 CSS filter 完全正常工作！
    // 暗家族：invert(1) 把白底翻成黑底，hue-rotate(180deg) 把颜色翻回正确色相，微调 contrast/saturate
    // 亮家族：清空 filter
    var darkMode = _getEmbedThemeMode() === 'dark';
    var wrapper = document.getElementById('projectIframeContainer');
    var iframe = document.getElementById('qmeow-embed');
    if (iframe) {
      if (darkMode) {
        // 真·明暗反色：Coze 默认白底亮卡片 → 暗底深卡片
        iframe.style.filter = 'invert(1) hue-rotate(180deg) contrast(0.95) saturate(0.92)';
        iframe.style.webkitFilter = iframe.style.filter;
        iframe.style.isolation = 'isolate';
        // 反色后纯白 (#ffffff → #000000) 太刺眼，换成一个接近我们 card-bg 的灰
        // 这样 invert 后是 ~#20202e，和 philosophic 风格背景协调
        iframe.style.background = '#e6eaf3';
        iframe.style.borderRadius = 'calc(var(--radius-md, 14px) - 2px)';
      } else {
        iframe.style.filter = '';
        iframe.style.webkitFilter = '';
        iframe.style.isolation = '';
        iframe.style.background = 'var(--card-bg, #fff)';
        iframe.style.borderRadius = '';
      }
    }
    // 容器（外层）保持，但简化——有了真·filter 后，容器只做轻微 frame 感，不要重 overlay 压住反色
    if (wrapper) {
      if (darkMode) {
        wrapper.style.padding = '0.5rem';
        wrapper.style.borderRadius = 'var(--radius-md, 14px)';
        wrapper.style.background = 'var(--card-bg, #181828)';
        wrapper.style.border = '1px solid rgba(var(--accent-rgb), 0.18)';
        wrapper.style.boxShadow = 'var(--card-shadow)';
        wrapper.style.margin = '1rem auto';
      } else {
        wrapper.style.padding = '';
        wrapper.style.borderRadius = '';
        wrapper.style.background = '';
        wrapper.style.border = '';
        wrapper.style.boxShadow = '';
        wrapper.style.margin = '';
      }
      // 移除旧的 data-attr overlay（invert 后内容已是深卡片，再盖暗色会糊）
      wrapper.removeAttribute('data-embed-theme');
    }
  }

  function _syncEmbedThemes() {
    var mode = _getEmbedThemeMode();
    // 博客：Coze 支持 theme=light/dark
    _updateIframeThemeParam('blog-embed', mode);
    // 项目：只能用 filter
    _updateProjectFilterMode();
  }

  function _initEmbedThemeSync() {
    // 初始同步
    _syncEmbedThemes();
    // 主题切换事件（theme.js 派发的 themeChanged）
    document.addEventListener('themeChanged', function () {
      // 延迟一帧，确保 body class 已经被 applyTheme 改掉
      setTimeout(_syncEmbedThemes, 30);
    });
  }

  function _initEmbeds() {
    _wireIframeEmbed('blog-embed',    'blogIframeContainer',    'blogFallback',    20000);
    _wireIframeEmbed('qmeow-embed',  'projectIframeContainer', 'projectFallback', 20000);
    _initEmbedThemeSync();
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
