/* Bupe Mwansa portfolio: hero sky, ring network, theme toggle, menu, chart tooltip, project filters, scroll fades. */
(function () {
  var root = document.documentElement;

  /* motion engine: one loop drives the hero sky and the page-wide network of small rings */
  (function () {
    var heroCv = document.getElementById('sky');
    var hero = heroCv.parentElement;
    var ringCv = document.getElementById('rings');
    var hc = heroCv.getContext('2d');
    var rc = ringCv.getContext('2d');
    if (!hc || !rc) return;
    var TAU = Math.PI * 2;
    var IDLE_ROT = 0.035;   /* hero ring turn at rest, radians per second */
    var IDLE_DRIFT = 9;     /* hero star drift at rest, pixels per second */
    var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var colors = { star: '#ffffff', gold: '#d6b466', ring: '#3a4a78' };
    var t = 0, sv = 0;
    var running = false, heroVisible = true, last = 0, raf = 0;
    var lastScrollY = 0;

    /* hero state */
    var W = 0, H = 0, DPR = 1, stars = [];
    var geo = { cx: 0, cy: 0, R: 0 };
    var ang = 0, driftX = 0, driftY = 0, shoot = null, nextShoot = 3.5;

    /* ring network state */
    var RW = 0, RH = 0, RDPR = 1, RR = 0, RM = 80, LINK = 240, rings = [], pp = 0, RING_DRIFT = 7;   /* ring drift in px/s at full depth */

    function tok(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
    function readColors() {
      colors.star = tok('--star') || colors.star;
      colors.gold = tok('--gold') || colors.gold;
      colors.ring = tok('--ring') || colors.ring;
    }
    function prng(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var q = Math.imul(seed ^ seed >>> 15, 1 | seed);
        q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q;
        return ((q ^ q >>> 14) >>> 0) / 4294967296;
      };
    }

    /* size the hero canvas and lay out its stars; positions are fractions so a resize keeps the same sky */
    function buildHero() {
      W = hero.clientWidth; H = hero.clientHeight;
      if (!W || !H) return false;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      heroCv.width = Math.round(W * DPR);
      heroCv.height = Math.round(H * DPR);
      geo.cx = W * 0.86; geo.cy = H * 0.46;
      geo.R = Math.min(Math.max(W * 0.5, 260), H * 1.15);
      var rnd = prng(2093), n = Math.min(Math.round(W * H / 4800), 300), i;
      stars = [];
      for (i = 0; i < n; i++) {
        stars.push({
          x: rnd(), y: rnd(),
          r: 0.4 + rnd() * 0.9,
          a: 0.2 + rnd() * 0.65,
          d: 0.3 + rnd() * 0.9,        /* depth: deeper stars move more slowly */
          p: rnd() * TAU,
          s: 0.6 + rnd() * 1.6,        /* twinkle speed */
          cross: i % 22 === 0,
          cl: 6 + rnd() * 8
        });
      }
      return true;
    }

    /* size the fixed canvas and place the rings; each ring has its own depth, so they slide at different rates */
    function buildRings() {
      RW = document.documentElement.clientWidth || window.innerWidth;
      RH = window.innerHeight || 700;
      if (!RW || !RH) return false;
      RDPR = Math.min(window.devicePixelRatio || 1, 2);
      if (RW * RH * RDPR * RDPR > 8e6) RDPR = 1;
      ringCv.width = Math.round(RW * RDPR);
      ringCv.height = Math.round(RH * RDPR);
      RR = RH + 2 * RM;
      LINK = Math.min(300, RW * 0.42);
      var rnd = prng(77), n = Math.max(7, Math.min(16, Math.round(RW * RH / 90000))), i;
      rings = [];
      for (i = 0; i < n; i++) {
        rings.push({
          bx: ((i * 0.618034) + rnd() * 0.15) % 1 * RW,
          by: ((i + 0.2 + rnd() * 0.6) / n) * RR,
          r: 12 + rnd() * 30,
          d: 0.25 + rnd() * 0.65,
          ax: 8 + rnd() * 14, ay: 6 + rnd() * 10,
          fx: 0.15 + rnd() * 0.2, ph: rnd() * TAU,
          w: (rnd() < 0.5 ? -1 : 1) * (0.06 + rnd() * 0.22),
          ang: rnd() * TAU,
          nt: rnd() < 0.5 ? 16 : 24,
          gold: rnd() < 0.45,
          x: 0, y: 0
        });
      }
      return true;
    }

    function spawnShoot() {
      var a = (18 + Math.random() * 16) * Math.PI / 180;
      var sp = 620 + Math.random() * 240;
      shoot = {
        x: W * (0.05 + Math.random() * 0.55), y: H * (0.05 + Math.random() * 0.35),
        ux: Math.cos(a), uy: Math.sin(a), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, dur: 0.85 + Math.random() * 0.3
      };
    }

    /* scroll position, clamped to the scrollable range so pushing against the top or bottom edge,
       or an overscroll bounce, never counts as movement */
    function scrollY() {
      var max = Math.max(0, (document.documentElement.scrollHeight || 0) - (window.innerHeight || 0));
      return Math.max(0, Math.min(max, window.pageYOffset || 0));
    }
    /* sv is the smoothed speed of real page scrolling in px/s, positive downwards; only the hero sky reads it */
    function scrollStep(dt) {
      var y = scrollY();
      var inst = (y - lastScrollY) / dt;
      lastScrollY = y;
      inst = Math.max(-3500, Math.min(3500, inst));
      var rate = Math.abs(inst) > Math.abs(sv) ? 14 : 2.5;   /* quick to react, slow to settle */
      sv += (inst - sv) * Math.min(1, rate * dt);
      if (Math.abs(sv) < 0.5) sv = 0;
    }

    function updateHero(dt) {
      ang += (IDLE_ROT + sv * 0.0003) * dt;
      driftY += (-IDLE_DRIFT - sv * 0.05) * dt;
      driftX += 3 * dt;
      if (shoot) {
        shoot.life += dt;
        if (shoot.life >= shoot.dur) shoot = null;
      } else {
        nextShoot -= dt;
        if (nextShoot <= 0) { spawnShoot(); nextShoot = 6 + Math.random() * 6; }
      }
    }

    function updateRings(dt) {
      var i, r;
      pp += 0.1 * dt;
      for (i = 0; i < rings.length; i++) {
        r = rings[i];
        r.ang += r.w * dt;
      }
    }

    function renderHero() {
      if (!W) return;
      var c = hc, cx = geo.cx, cy = geo.cy, R = geo.R;
      var i, a, s, x, y, tw, streak, l, j, k, hx, hy;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.clearRect(0, 0, W, H);
      c.lineWidth = 1;
      c.lineCap = 'butt';
      c.strokeStyle = colors.ring; c.fillStyle = colors.ring;
      c.globalAlpha = 0.9;

      /* rings, with the dashed ring and the tilted ellipse turning against the dial */
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      c.beginPath(); c.arc(cx, cy, R - 30, 0, TAU); c.stroke();
      c.setLineDash([2, 6]);
      c.lineDashOffset = -ang * R * 0.72;
      c.beginPath(); c.arc(cx, cy, R * 0.72, 0, TAU); c.stroke();
      c.setLineDash([]);
      c.lineDashOffset = 0;
      c.beginPath(); c.arc(cx, cy, R * 0.42, 0, TAU); c.stroke();
      c.beginPath(); c.ellipse(cx, cy, R * 0.72, R * 0.3, -0.38 - ang * 0.5, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();

      /* degree ticks, batched into three strokes by length */
      for (j = 0; j < 3; j++) {
        c.beginPath();
        for (i = 0; i < 180; i++) {
          if ((j === 0 && (i % 5 === 0)) || (j === 1 && (i % 5 !== 0 || i % 15 === 0)) || (j === 2 && i % 15 !== 0)) continue;
          a = i * TAU / 180 + ang;
          l = j === 0 ? 5 : (j === 1 ? 11 : 18);
          c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          c.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l));
        }
        c.stroke();
      }
      c.font = '11px "DM Mono", ui-monospace, monospace';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = 0.95;
      for (i = 0; i < 180; i += 15) {
        a = i * TAU / 180 + ang;
        c.fillText(String(i * 2), cx + Math.cos(a) * (R - 44), cy + Math.sin(a) * (R - 44));
      }

      /* stars: twinkle at rest, drift with depth, and streak while the page scrolls */
      c.lineCap = 'round';
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        x = ((s.x * W + driftX * s.d) % W + W) % W;
        y = ((s.y * H + driftY * s.d) % H + H) % H;
        tw = 0.7 + 0.3 * Math.sin(t * s.s + s.p);
        c.globalAlpha = s.a * tw;
        c.fillStyle = colors.star;
        c.beginPath(); c.arc(x, y, s.r, 0, TAU); c.fill();
        streak = Math.min(Math.abs(sv) * s.d * 0.018, 46);
        if (streak > 2) {
          c.strokeStyle = colors.star;
          c.lineWidth = Math.max(0.7, s.r);
          c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + (sv > 0 ? streak : -streak)); c.stroke();
        }
        if (s.cross) {
          l = s.cl * (1 + Math.min(Math.abs(sv) / 3000, 0.6));
          c.globalAlpha = 0.55 + 0.3 * Math.sin(t * 1.3 + s.p);
          c.strokeStyle = colors.gold; c.lineWidth = 1;
          c.beginPath(); c.moveTo(x - l, y); c.lineTo(x + l, y); c.moveTo(x, y - l); c.lineTo(x, y + l); c.stroke();
          c.fillStyle = colors.gold; c.beginPath(); c.arc(x, y, 1.4, 0, TAU); c.fill();
        }
      }

      /* an occasional shooting star */
      if (shoot) {
        k = shoot.life / shoot.dur;
        hx = shoot.x + shoot.vx * shoot.life;
        hy = shoot.y + shoot.vy * shoot.life;
        c.strokeStyle = colors.gold;
        for (j = 0; j < 10; j++) {
          c.globalAlpha = (1 - j / 10) * (1 - k) * 0.9;
          c.lineWidth = 1.6 - j * 0.12;
          c.beginPath();
          c.moveTo(hx - shoot.ux * j * 9, hy - shoot.uy * j * 9);
          c.lineTo(hx - shoot.ux * (j + 1) * 9, hy - shoot.uy * (j + 1) * 9);
          c.stroke();
        }
      }
      c.globalAlpha = 1;
    }

    function renderRings() {
      if (!RW) return;
      var c = rc, n = rings.length;
      var i, j, k, a, b, r, dx, dy, dist, al, u, top, bot, px, py, rr, aa, len;
      c.setTransform(RDPR, 0, 0, RDPR, 0, 0);
      c.clearRect(0, 0, RW, RH);
      c.lineWidth = 1;
      c.lineCap = 'butt';

      /* positions: each ring drifts upward at its own slow rate, wraps around the viewport and sways; scroll plays no part */
      for (i = 0; i < n; i++) {
        r = rings[i];
        r.y = (((r.by - t * RING_DRIFT * r.d) % RR) + RR) % RR - RM + Math.cos(t * r.fx * 0.8 + r.ph) * r.ay;
        r.x = r.bx + Math.sin(t * r.fx + r.ph) * r.ax;
      }

      /* links between rings that are close, with a light travelling down each third link */
      c.strokeStyle = colors.ring;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          a = rings[i]; b = rings[j];
          dx = b.x - a.x; dy = b.y - a.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= LINK) continue;
          al = Math.pow(1 - dist / LINK, 1.3) * 0.45;
          if (al > 0.8) al = 0.8;
          c.globalAlpha = al;
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          if ((i * 7 + j * 3) % 3 === 0) {
            u = (pp + i * 0.37 + j * 0.61) % 1;
            if (u < 0) u += 1;
            top = a.y <= b.y ? a : b;
            bot = top === a ? b : a;
            px = top.x + (bot.x - top.x) * u;
            py = top.y + (bot.y - top.y) * u;
            c.globalAlpha = Math.min(1, al * 2.2);
            c.fillStyle = colors.gold;
            c.beginPath(); c.arc(px, py, 1.8, 0, TAU); c.fill();
          }
        }
      }

      /* the rings: outline, inner circle, turning ticks and a small bead */
      for (i = 0; i < n; i++) {
        r = rings[i];
        rr = r.r;
        c.strokeStyle = colors.ring;
        c.globalAlpha = 0.7;
        c.beginPath(); c.arc(r.x, r.y, rr, 0, TAU); c.stroke();
        c.globalAlpha = 0.5;
        c.beginPath(); c.arc(r.x, r.y, rr * 0.62, 0, TAU); c.stroke();
        c.globalAlpha = 0.7;
        c.beginPath();
        for (k = 0; k < r.nt; k++) {
          aa = r.ang + k * TAU / r.nt;
          len = k % 6 === 0 ? 6 : 3;
          c.moveTo(r.x + Math.cos(aa) * rr, r.y + Math.sin(aa) * rr);
          c.lineTo(r.x + Math.cos(aa) * (rr - len), r.y + Math.sin(aa) * (rr - len));
        }
        c.stroke();
        aa = r.ang * 1.7;
        c.globalAlpha = 0.9;
        c.fillStyle = r.gold ? colors.gold : colors.star;
        c.beginPath(); c.arc(r.x + Math.cos(aa) * rr * 0.62, r.y + Math.sin(aa) * rr * 0.62, 2, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    }

    function tick(ts) {
      raf = 0;
      if (!running) return;
      var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      t += dt;
      scrollStep(dt);
      updateRings(dt);
      renderRings();
      if (heroVisible) { updateHero(dt); renderHero(); }
      raf = requestAnimationFrame(tick);
    }
    /* run only when motion is allowed and the tab is visible; the hero part also waits for the hero to be on screen */
    function setRunning() {
      var want = !reduceMq.matches && !document.hidden;
      if (want && !running) {
        running = true; last = 0;
        lastScrollY = scrollY();
        raf = requestAnimationFrame(tick);
      } else if (!want && running) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    function still() { if (!running) { renderHero(); renderRings(); } }
    function rebuild() {
      var a = buildHero(), b = buildRings();
      if (a || b) { readColors(); still(); }
    }


    readColors();
    buildHero(); buildRings();
    renderHero(); renderRings();
    window.addEventListener('resize', rebuild);
    if (window.ResizeObserver) { new ResizeObserver(rebuild).observe(hero); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(still); }
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColors(); still(); }); } catch (e) {}
    try { reduceMq.addEventListener('change', function () { setRunning(); still(); }); } catch (e) {}
    new MutationObserver(function () { readColors(); still(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', setRunning);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }).observe(hero);
    }
    setRunning();
  })();

  /* blocks fade and rise in as they enter the viewport, and fade out as they leave */
  (function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '.t, .about-text, .facts, .focus > div, .g, .legend, .chart, .filters, .cat-note, .obj, .hon > div, .fig > div, .fig-link, .contact > *';
    var els = [].slice.call(document.querySelectorAll(sel));
    if (!els.length) return;
    root.classList.add('rvjs');
    els.forEach(function (el) { el.classList.add('rv'); });
    /* stagger by position among tagged siblings */
    els.forEach(function (el) {
      var p = el.parentElement, k = 0, idx = 0;
      if (p) {
        [].slice.call(p.children).forEach(function (c) {
          if (c.classList.contains('rv')) { if (c === el) idx = k; k++; }
        });
      }
      el.style.setProperty('--i', String(Math.min(idx, 6)));
    });
    /* anything already on screen starts visible, so there is no flash on load */
    var vh = window.innerHeight || 800;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom > vh * 0.05 && r.top < vh * 0.95) { el.classList.add('in'); el.classList.add('now'); }
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { els.forEach(function (el) { el.classList.remove('now'); }); });
    });
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      fired = true;
      entries.forEach(function (en) {
        var el = en.target;
        if (en.isIntersecting) {
          el.classList.remove('up');
          el.classList.add('in');
        } else {
          var top = en.rootBounds ? en.rootBounds.top : 0;
          el.classList.toggle('up', en.boundingClientRect.top < top);
          el.classList.remove('in');
        }
      });
    }, { rootMargin: '-5% 0px -5% 0px', threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
    /* if the observer never reports, show everything rather than leave it hidden */
    setTimeout(function () {
      if (fired) return;
      io.disconnect();
      els.forEach(function (el) { el.classList.add('in'); });
    }, 1500);
  })();

  /* project filters */
  (function () {
    var bar = document.querySelector('.filters');
    if (!bar) return;
    var btns = [].slice.call(bar.querySelectorAll('button[data-f]'));
    var items = [].slice.call(document.querySelectorAll('.obj[data-lang]'));
    var rows = [].slice.call(document.querySelectorAll('.brow[data-lang]'));
    var count = document.getElementById('fcount');
    function has(el, f) {
      return f === 'all' || (' ' + el.getAttribute('data-lang') + ' ').indexOf(' ' + f + ' ') > -1;
    }
    function apply(f) {
      var shown = 0;
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === f ? 'true' : 'false'); });
      items.forEach(function (el) {
        if (has(el, f)) {
          shown++;
          if (el.hidden) {
            el.hidden = false;
            el.classList.remove('flash');
            void el.offsetWidth;
            el.classList.add('flash');
          }
        } else {
          el.hidden = true;
        }
      });
      rows.forEach(function (el) { el.classList.toggle('dim', !has(el, f)); });
      count.textContent = 'Showing ' + shown + ' of ' + items.length;
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]');
      if (b) apply(b.getAttribute('data-f'));
    });
  })();

  /* theme toggle */
  var tbtn = document.getElementById('theme-btn');
  function effective() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function themeLabel() { tbtn.setAttribute('aria-label', 'Switch to ' + (effective() === 'dark' ? 'light' : 'dark') + ' theme'); }
  try {
    var saved = localStorage.getItem('bm-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
  tbtn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('bm-theme', next); } catch (e) {}
    themeLabel();
  });
  themeLabel();

  /* mobile menu */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menuBtn.focus(); }
  });

  /* section highlight in the nav */
  var links = [].slice.call(nav.querySelectorAll('a'));
  var byId = {};
  links.forEach(function (l) { byId[l.getAttribute('href').slice(1)] = l; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          byId[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'skills', 'projects', 'record', 'contact'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* chart tooltip and table view */
  var tip = document.getElementById('tip');
  function showTip(el, x, y) {
    tip.textContent = el.getAttribute('data-tip');
    tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var tx = Math.max(8, Math.min(x + 12, window.innerWidth - r.width - 8));
    var ty = y - r.height - 10;
    if (ty < 8) ty = y + 18;
    tip.style.left = tx + 'px';
    tip.style.top = ty + 'px';
  }
  function hideTip() { tip.hidden = true; }
  [].slice.call(document.querySelectorAll('.brow[data-tip]')).forEach(function (row) {
    row.addEventListener('mouseenter', function (e) { showTip(row, e.clientX, e.clientY); });
    row.addEventListener('mousemove', function (e) { showTip(row, e.clientX, e.clientY); });
    row.addEventListener('mouseleave', hideTip);
    row.addEventListener('focus', function () {
      var r = row.getBoundingClientRect();
      showTip(row, r.left + r.width / 2, r.top);
    });
    row.addEventListener('blur', hideTip);
  });
  var bars = document.getElementById('bars');
  var tview = document.getElementById('tview');
  var tgl = document.getElementById('toggle-table');
  tgl.addEventListener('click', function () {
    var showTable = tview.hidden;
    tview.hidden = !showTable;
    bars.hidden = showTable;
    tgl.textContent = showTable ? 'View as chart' : 'View as table';
    hideTip();
  });

  /* copy address */
  var btn = document.getElementById('copy-mail');
  var status = document.getElementById('copy-status');
  var addr = document.getElementById('mail-address');
  function selectAddr() {
    var r = document.createRange();
    r.selectNodeContents(addr);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  btn.addEventListener('click', function () {
    var text = addr.textContent.trim();
    var p;
    try { p = navigator.clipboard.writeText(text); } catch (e) { p = Promise.reject(e); }
    p.then(function () {
      status.textContent = 'Copied';
    }).catch(function () {
      selectAddr();
      status.textContent = 'Selected, press copy';
    });
    setTimeout(function () { status.textContent = ''; }, 2500);
  });

  /* fetch GitHub stats dynamically */
  (function () {
    var statsDiv = document.getElementById('gh-stats');
    if (!statsDiv) return;

    var username = 'ProfessorMB21';

    /* fetch user data for followers and public repos */
    fetch('https://api.github.com/users/' + username)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.public_repos !== undefined) {
          var el = statsDiv.querySelector('[data-stat="repos"]');
          if (el) el.textContent = String(data.public_repos);
        }
        if (data.followers !== undefined) {
          var el = statsDiv.querySelector('[data-stat="followers"]');
          if (el) el.textContent = String(data.followers);
        }
      })
      .catch(function () {});

    /* fetch starred repos count */
    fetch('https://api.github.com/search/repositories?q=user:' + username + '+stars:>0&sort=stars&per_page=1')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.total_count !== undefined) {
          var el = statsDiv.querySelector('[data-stat="starred"]');
          if (el) el.textContent = String(data.total_count);
        }
      })
      .catch(function () {});
  })();
})();
