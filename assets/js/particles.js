/* ======================================================================
 * particles.js  —  粒子画布 + 四模式（秩序/发散/聚焦/AI网络）· v3.0.0
 *
 * v3.0.0 粒子优化
 *   1) 移动端粒子数缩减：窄屏 (<768px) 下各模式粒子数约降为桌面 45%，
 *      保持视觉效果的同时显著降低低端机 CPU 占用。
 *   2) 页面不可见（visibilitychange）时暂停 rAF 动画，恢复时续播——
 *      避免后台标签页的无效 GPU 开销。
 *   3) 颜色使用全局缓存 window.cachedAccentRgb / cachedTextRgb，
 *      避免每帧 getComputedStyle 调用（theme.js 负责更新缓存）。
 *   4) ResizeObserver / resize 双路兼容，统一做粒子坐标回栏修正。
 *
 * 依赖：theme.js（需先加载，提供 cachedAccentRgb 等）
 *       i18n-init.js（提供 window.t() 用于模式描述文字）
 * ==================================================================== */
(function () {
  'use strict';

  var section = null;
  var canvas  = null;
  var ctx     = null;
  var particles = [];
  var mode    = 'order';
  window._particleMode = mode;

  var animationId = null;
  var resizeTimer = null;
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var containerWidth  = 0;
  var containerHeight = 0;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 工具：检测移动端，决定粒子规模 ----------
  function isNarrowScreen() {
    try {
      return window.matchMedia('(max-width: 767.98px)').matches;
    } catch (_) {
      return window.innerWidth < 768;
    }
  }

  // ---------- canvas 尺寸 ----------
  function updateCanvasSize() {
    section = document.getElementById('particle-section');
    canvas  = document.getElementById('particle-canvas');
    if (!section || !canvas) return false;
    var rect = section.getBoundingClientRect();
    containerWidth  = Math.max(1, rect.width);
    containerHeight = Math.max(1, Math.min(700, rect.height));
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width  = Math.floor(containerWidth * dpr);
    canvas.height = Math.floor(containerHeight * dpr);
    canvas.style.width  = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return !!ctx;
  }

  // ==================================================================
  // Particle 类
  // ==================================================================
  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x  = Math.random() * containerWidth;
      this.y  = Math.random() * containerHeight;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size     = Math.random() * 2 + 0.3;
      this.baseSize = Math.random() * 2 + 0.3;
      this.opacity  = Math.random() * 0.7 + 0.3;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }
    update() {
      this.pulsePhase += this.pulseSpeed * (reducedMotion ? 0.1 : 1);
      this.size = this.baseSize * (1 + (reducedMotion ? 0.05 : Math.sin(this.pulsePhase) * 0.3));

      if (reducedMotion) return;

      if (mode === 'order') {
        var gx = Math.round(this.x / 40) * 40 + 20;
        var gy = Math.round(this.y / 40) * 40 + 20;
        this.vx += (gx - this.x) * 0.008;
        this.vy += (gy - this.y) * 0.008;
      } else if (mode === 'chaos') {
        this.vx += (Math.random() - 0.5) * 0.15;
        this.vy += (Math.random() - 0.5) * 0.15;
        this.pulseSpeed = Math.random() * 0.05 + 0.01;
      } else if (mode === 'focus') {
        var dx = containerWidth / 2 - this.x;
        var dy = containerHeight / 2 - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          var force = Math.min(0.06, 1 / (dist * 0.01));
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
          this.opacity = Math.min(0.9, 0.3 + (1 - dist / Math.max(containerWidth, containerHeight)) * 0.6);
        }
      } else if (mode === 'ai') {
        var layerCount = 3;
        var nodesPerLayer = Math.ceil(particles.length / layerCount);
        var nodeIndex = this.aiNodeIndex || 0;
        var currentLayer = Math.min(layerCount - 1, Math.floor(nodeIndex / nodesPerLayer));
        var posInLayer = nodeIndex % nodesPerLayer;
        var layerWidth = containerWidth / layerCount;
        var targetX = layerWidth * currentLayer + layerWidth / 2;
        var targetY = containerHeight * (posInLayer + 1) / (nodesPerLayer + 1);
        var jitterX = Math.sin(Date.now() * 0.001 + nodeIndex) * 8;
        var jitterY = Math.cos(Date.now() * 0.0015 + nodeIndex) * 5;
        this.vx += (targetX + jitterX - this.x) * 0.02;
        this.vy += (targetY + jitterY - this.y) * 0.02;
        this.pulseSpeed = 0.04 + Math.sin(Date.now() * 0.002 + nodeIndex * 0.5) * 0.02;
      }

      this.vx *= 0.96;
      this.vy *= 0.96;
      this.vy += 0.01;

      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -10 || this.x > containerWidth + 10 ||
          this.y < -10 || this.y > containerHeight + 10) {
        this.reset();
      }
    }
    draw() {
      var rgb     = window.cachedAccentRgb || '99, 102, 241';
      var textRgb = window.cachedTextRgb   || '31, 41, 55';

      if (mode === 'ai') {
        var glowSize = this.size * (3 + Math.sin(this.pulsePhase) * 0.5);
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        var glowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glowGrad.addColorStop(0, 'rgba(' + rgb + ', ' + (this.opacity * 0.35) + ')');
        glowGrad.addColorStop(0.5, 'rgba(' + rgb + ', ' + (this.opacity * 0.1) + ')');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ', ' + this.opacity + ')';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (this.opacity * 0.6) + ')';
        ctx.fill();
      } else {
        var gradient = ctx.createRadialGradient(
          this.x, this.y, 0, this.x, this.y, this.size
        );
        gradient.addColorStop(0, 'rgba(' + rgb + ', ' + (this.opacity * 0.8) + ')');
        gradient.addColorStop(0.5, 'rgba(' + rgb + ', ' + (this.opacity * 0.4) + ')');
        gradient.addColorStop(1, 'rgba(' + textRgb + ', ' + (this.opacity * 0.1) + ')');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        var glowGradient = ctx.createRadialGradient(
          this.x, this.y, 0, this.x, this.y, this.size * 2.5
        );
        glowGradient.addColorStop(0, 'rgba(' + rgb + ', ' + (this.opacity * 0.15) + ')');
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
    }
  }

  // ==================================================================
  // 初始化 / 动画 / 模式切换
  // ==================================================================

  // v3.0.0: 移动端粒子数显著减少（桌面 focus=120 → 移动端 focus=50 等）
  function particleCountByMode() {
    var narrow = isNarrowScreen();
    var focus  = narrow ? 50  : 120;
    var ai     = narrow ? 35  : 80;
    var base   = narrow ? 25  : 60;   // order / chaos
    if (mode === 'focus') return focus;
    if (mode === 'ai')    return ai;
    return base;
  }

  function initParticles() {
    particles = [];
    var count = particleCountByMode();
    var layerCount = 3;
    var nodesPerLayer = Math.ceil(count / layerCount);
    for (var i = 0; i < count; i++) {
      var p = new Particle();
      if (mode === 'ai') {
        p.aiNodeIndex = i;
        p.baseSize = Math.random() * 2 + 2;
        p.opacity = 0.6 + Math.random() * 0.3;
      }
      particles.push(p);
    }
  }

  function animateParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    var rgbStr = window.cachedAccentRgb || '99, 102, 241';
    var now = Date.now();

    if (reducedMotion) {
      for (var ir = 0; ir < particles.length; ir++) particles[ir].draw();
      animationId = requestAnimationFrame(animateParticles);
      return;
    }

    if (mode === 'ai') {
      var _layerCount = 3;
      var _nodesPerLayer = Math.ceil(particles.length / _layerCount);
      for (var i = 0; i < particles.length; i++) {
        var _curLayer = Math.min(_layerCount - 1, Math.floor(i / _nodesPerLayer));
        if (_curLayer < _layerCount - 1) {
          var _nextStart = (_curLayer + 1) * _nodesPerLayer;
          var _nextEnd   = Math.min(particles.length, _nextStart + _nodesPerLayer);
          for (var j = _nextStart; j < _nextEnd; j++) {
            if (Math.sin(i * 7.3 + j * 13.7) > -0.3) {
              var p1 = particles[i], p2 = particles[j];
              ctx.strokeStyle = 'rgba(' + rgbStr + ', 0.06)';
              ctx.lineWidth = 0.4;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();

              var signalSpeed  = 0.0008;
              var signalOffset = ((now * signalSpeed + i * 0.3 + j * 0.2) % 1);
              var sx = p1.x + (p2.x - p1.x) * signalOffset;
              var sy = p1.y + (p2.y - p1.y) * signalOffset;
              var signalOpacity = Math.sin(signalOffset * Math.PI) * 0.7;
              ctx.beginPath();
              ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(' + rgbStr + ', ' + signalOpacity + ')';
              ctx.fill();

              for (var tr = 1; tr <= 3; tr++) {
                var trailOffset = signalOffset - tr * 0.03;
                if (trailOffset > 0) {
                  var tx = p1.x + (p2.x - p1.x) * trailOffset;
                  var ty = p1.y + (p2.y - p1.y) * trailOffset;
                  var top = Math.sin(trailOffset * Math.PI) * 0.3 / tr;
                  ctx.beginPath();
                  ctx.arc(tx, ty, 1.2 - tr * 0.2, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(' + rgbStr + ', ' + top + ')';
                  ctx.fill();
                }
              }
            }
          }
        }
      }
    } else if (mode === 'chaos') {
      ctx.lineWidth = 0.2;
      for (var ci = 0; ci < particles.length; ci++) {
        for (var cj = ci + 1; cj < particles.length; cj++) {
          var cdx = particles[ci].x - particles[cj].x;
          var cdy = particles[ci].y - particles[cj].y;
          var cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < 60) {
            var cop = (1 - cdist / 60) * 0.15 * (particles[ci].opacity + particles[cj].opacity) / 2;
            ctx.strokeStyle = 'rgba(' + rgbStr + ', ' + cop + ')';
            ctx.lineWidth = (1 - cdist / 60) * 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[ci].x, particles[ci].y);
            ctx.lineTo(particles[cj].x, particles[cj].y);
            ctx.stroke();
          }
        }
      }
    }

    for (var k = 0; k < particles.length; k++) {
      particles[k].update();
      particles[k].draw();
    }
    animationId = requestAnimationFrame(animateParticles);
  }

  function setMode(newMode) {
    mode = newMode;
    window._particleMode = newMode;
    var btns = document.querySelectorAll('.control-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    var ab = document.getElementById('btn-' + newMode);
    if (ab) ab.classList.add('active');
    initParticles();
    _refreshParticleDesc();
  }
  window._refreshParticleDesc = _refreshParticleDesc;

  function _refreshParticleDesc() {
    var desc = document.getElementById('particle-desc');
    if (!desc || typeof window.t !== 'function') return;
    var ds = {
      order: window.t('desc.order'),
      chaos: window.t('desc.chaos'),
      focus: window.t('desc.focus'),
      ai:    window.t('desc.ai')
    };
    var txt = ds[mode];
    if (txt) {
      desc.style.opacity = '0';
      setTimeout(function () {
        desc.textContent = txt;
        desc.style.opacity = '1';
      }, 300);
    }
  }

  function startParticles() {
    if (!updateCanvasSize()) {
      setTimeout(startParticles, 100);
      return;
    }
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    initParticles();
    if (animationId) cancelAnimationFrame(animationId);
    animateParticles();
  }

  // ---------- 页面可见性：暂停 / 续播 ----------
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else if (!animationId && canvas) {
      animateParticles();
    }
  });

  // ---------- ResizeObserver / resize：保持画布尺寸 + 粒子回栏 ----------
  function _clampParticlesInView() {
    if (!updateCanvasSize()) return;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.x > containerWidth)  p.x = containerWidth - 10;
      if (p.y > containerHeight) p.y = containerHeight - 10;
    }
  }

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].target.id === 'particle-section') _clampParticlesInView();
      }
    });
    try { ro.observe(document.getElementById('particle-section')); } catch (_) {}
  } else {
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(_clampParticlesInView, 150);
    });
  }

  // 视口尺寸变化（横/竖屏切换）时也刷新粒子数配比（移动端检测可能变化）
  window.matchMedia('(max-width: 767.98px)').addEventListener('change', function () {
    if (canvas) initParticles();
  });

  // ---------- 控制按钮 + 启动 ----------
  function _wireControls() {
    var o = document.getElementById('btn-order');
    var c = document.getElementById('btn-chaos');
    var f = document.getElementById('btn-focus');
    var a = document.getElementById('btn-ai');
    if (o) o.addEventListener('click', function () { setMode('order'); });
    if (c) c.addEventListener('click', function () { setMode('chaos'); });
    if (f) f.addEventListener('click', function () { setMode('focus'); });
    if (a) a.addEventListener('click', function () { setMode('ai'); });
  }

  function init() {
    _wireControls();
    startParticles();
    if (typeof window.updateBalanceColors === 'function') {
      setTimeout(window.updateBalanceColors, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
