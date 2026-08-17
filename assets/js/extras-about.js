/* ======================================================================
 * extras-about.js  —  about.html「关于页 / 项目文档」专属交互
 *
 *   1) 侧边文档目录（doc-sidebar）高亮当前阅读章节（scrollspy）
 *   2) 目录锚点平滑滚动
 *   3) 文档头背景视差（同主页 Banner 逻辑）
 *   4) 文档代码块复制按钮（如存在 .code-block）
 * ==================================================================== */
(function () {
  'use strict';

  // ---------- 1/2 文档目录 scrollspy ----------
  function _wireDocSidebar() {
    var nav = document.getElementById('docSidebar');
    if (!nav) return;
    var links = nav.querySelectorAll('a[href^="#"]');
    var ids = [];
    links.forEach(function (a) {
      var h = a.getAttribute('href').substring(1);
      if (h) ids.push(h);
      a.addEventListener('click', function (e) {
        var target = document.getElementById(h);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 移动端目录：点击后收起
        if (nav.classList.contains('mobile-open')) nav.classList.remove('mobile-open');
      });
    });
    if (!ids.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id;
          links.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });

    // 移动端目录展开按钮
    var toggle = document.getElementById('docSidebarToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        nav.classList.toggle('mobile-open');
      });
    }
  }

  // ---------- 3 头图视差 ----------
  function _wireAboutParallax() {
    var hero = document.getElementById('aboutHero');
    if (!hero) return;
    window.addEventListener('scroll', function () {
      hero.style.backgroundPositionY = (window.scrollY * 0.35) + 'px';
    }, { passive: true });
  }

  // ---------- 4 代码块一键复制 ----------
  function _wireCodeBlockCopy() {
    var blocks = document.querySelectorAll('.code-block');
    if (!blocks.length) return;
    blocks.forEach(function (blk) {
      var btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', 'Copy code');
      btn.textContent = 'Copy';
      btn.style.cssText = [
        'position:absolute;top:8px;right:8px;padding:4px 10px;font-size:12px',
        'border-radius:6px;border:1px solid var(--border-color)',
        'background:var(--card-bg);color:var(--text-color);cursor:pointer',
        'opacity:0.85;transition:opacity .15s'
      ].join(';');
      blk.style.position = 'relative';
      btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
      btn.addEventListener('mouseleave', function () { btn.style.opacity = '0.85'; });
      btn.addEventListener('click', function () {
        var code = blk.querySelector('code, pre');
        var txt = (code ? code.textContent : blk.textContent) || '';
        var done = function (ok) {
          btn.textContent = ok ? '✓' : '×';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () { done(true); }).catch(function () { done(false); });
        } else {
          try {
            var ta = document.createElement('textarea');
            ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            done(true);
          } catch (_) { done(false); }
        }
      });
      blk.appendChild(btn);
    });
  }

  function init() {
    _wireDocSidebar();
    _wireAboutParallax();
    _wireCodeBlockCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
