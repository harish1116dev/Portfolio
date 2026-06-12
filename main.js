'use strict';
/* ════════════════════════════════════════════════════════
   HARISH PORTFOLIO — THE AWAKENING
   Full Cinematic Sequence
   ════════════════════════════════════════════════════════ */

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(pointer: fine)').matches;
const MOBILE = innerWidth < 720;

let mx = innerWidth / 2, my = innerHeight / 2;
let phase = 'boot';
let introDone = false;
let skipIntro = false;

// ── Custom cursor (fine pointers only) ─────────────────
let dot = null, ring = null;
if (FINE) {
  dot = Object.assign(document.createElement('div'), { id: 'cur-dot' });
  ring = Object.assign(document.createElement('div'), { id: 'cur-ring' });
  document.body.append(dot, ring);
  document.body.classList.add('has-cursor');
}

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
  if (ring) { ring.style.left = mx + 'px'; ring.style.top = my + 'px'; }
  const sl = $('spotlight');
  if (sl) sl.style.background = `radial-gradient(circle 360px at ${mx}px ${my}px, rgba(255,190,0,0.075) 0%, transparent 70%)`;
  if (phase === 'hero' && FINE && !REDUCED) {
    const dx = mx / innerWidth - 0.5;
    const dy = my / innerHeight - 0.5;
    const nw = $('name-wrap'), cb = $('code-bg');
    if (nw) nw.style.transform = `translate(${dx * -12}px,${dy * -6}px)`;
    if (cb) cb.style.transform = `translate(${dx * 28}px,${dy * 18}px)`;
  }
});

// ── Canvas resize ──────────────────────────────────────
function resize() {
  [$('grain'), $('dust'), $('geo')].forEach(c => {
    c.width = innerWidth; c.height = innerHeight;
  });
}
resize();
window.addEventListener('resize', resize);

/* ════════════════════════════════════════════════════════
   GRAIN
   ════════════════════════════════════════════════════════ */
(function () {
  const c = $('grain'), ctx = c.getContext('2d');
  // Small noise tile repeated across the screen — far cheaper than
  // regenerating a full-screen ImageData buffer every few frames.
  const tile = document.createElement('canvas');
  tile.width = tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  let f = 0;
  (function loop() {
    if (document.hidden) { requestAnimationFrame(loop); return; }
    if (++f % 3 === 0) {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      tctx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = ctx.createPattern(tile, 'repeat');
      ctx.fillRect(0, 0, c.width, c.height);
    }
    requestAnimationFrame(loop);
  })();
  $('grain').style.opacity = '0.033';
})();

/* ════════════════════════════════════════════════════════
   GOLD DUST PARTICLES
   ════════════════════════════════════════════════════════ */
(function () {
  const c = $('dust'), ctx = c.getContext('2d');
  const pts = Array.from({ length: MOBILE ? 60 : 160 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.3 + 0.2,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -(Math.random() * 0.3 + 0.07),
    a: Math.random() * 0.38 + 0.05,
    fs: Math.random() * 0.012 + 0.004,
    fp: Math.random() * Math.PI * 2,
  }));
  let t = 0;
  (function loop() {
    if (document.hidden) { requestAnimationFrame(loop); return; }
    ctx.clearRect(0, 0, c.width, c.height);
    t += 0.3;
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -4) { p.y = c.height + 4; p.x = Math.random() * c.width; }
      if (p.x < -4 || p.x > c.width + 4) p.x = Math.random() * c.width;
      const oa = p.a * (0.5 + 0.5 * Math.sin(t * p.fs + p.fp));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,210,0,${oa})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  })();
})();

/* ════════════════════════════════════════════════════════
   THREE.JS — wireframe geometry
   ════════════════════════════════════════════════════════ */
(function () {
  if (!window.THREE) return;
  const T = window.THREE;
  const c = $('geo');
  const renderer = new T.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 5;

  const grp = new T.Group();
  scene.add(grp);

  const mkWire = (geo, color, opacity) => {
    const m = new T.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
    return new T.Mesh(geo, m);
  };

  const outer = mkWire(new T.IcosahedronGeometry(2, 2), 0xFFD700, 0.048);
  const inner = mkWire(new T.OctahedronGeometry(1.1, 2), 0xFFC200, 0.065);
  grp.add(outer, inner);

  const ndGeo = new T.BufferGeometry();
  const npos = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 2 + (Math.random() - 0.5) * 0.25;
    npos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    npos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    npos[i * 3 + 2] = r * Math.cos(ph);
  }
  ndGeo.setAttribute('position', new T.BufferAttribute(npos, 3));
  grp.add(new T.Points(ndGeo, new T.PointsMaterial({ color: 0xFFD700, size: 0.020, transparent: true, opacity: 0.5 })));

  for (let k = 0; k < 3; k++) {
    const pts = new T.EllipseCurve(0, 0, 2.15 + k * .2, 2.15 + k * .2, 0, Math.PI * 2).getPoints(90);
    const g = new T.BufferGeometry().setFromPoints(pts.map(p => new T.Vector3(p.x, p.y, 0)));
    const line = new T.Line(g, new T.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.03 + k * .01 }));
    line.rotation.x = Math.PI / 2 + k * 0.55;
    line.rotation.y = k * 0.85;
    grp.add(line);
  }

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    t += 0.003;
    grp.rotation.y = t * 0.35;
    grp.rotation.x = t * 0.11;
    inner.rotation.y = -t * 0.52;
    inner.rotation.z = t * 0.2;
    grp.position.x = (mx / innerWidth - 0.5) * 0.55;
    grp.position.y = -(my / innerHeight - 0.5) * 0.55;
    renderer.render(scene, camera);
  })();
})();



/* ════════════════════════════════════════════════════════
   LINUX TERMINAL SEQUENCE
   ════════════════════════════════════════════════════════ */
const PROMPT_HTML = `<span class="prompt"><span class="user">harish</span><span class="at">@</span><span class="host">portfolio</span><span class="colon">:</span><span class="path">~</span><span class="dollar">$</span>&nbsp;</span>`;

const COMMANDS = [
  {
    cmd: 'cat /proc/identity',
    delay: 40,
    output: [
      { t: `<span class="oc-dim">──────────────────────────────────────</span>` },
      { t: `<span class="oc-head">NAME</span><span class="oc-dim">        :</span>  <span class="oc-gold">Harish</span>` },
      { t: `<span class="oc-head">ROLE</span><span class="oc-dim">        :</span>  <span class="oc-wht">Full Stack Developer  ·  AI Builder</span>` },
      { t: `<span class="oc-head">MODE</span><span class="oc-dim">        :</span>  <span class="oc-cyan">Creative Engineer</span>` },
      { t: `<span class="oc-head">STATUS</span><span class="oc-dim">      :</span>  <span class="oc-grn">● ONLINE</span>` },
      { t: `<span class="oc-head">LOCATION</span><span class="oc-dim">    :</span>  <span class="oc-wht">India  🇮🇳</span>` },
      { t: `<span class="oc-dim">──────────────────────────────────────</span>` },
    ]
  },
  {
    cmd: 'ls -lh /skills/',
    delay: 38,
    output: [
      { t: `<span class="oc-dim">total 9.9G</span>` },
      { t: `<span class="oc-grn">-rwxr-xr-x</span>  <span class="oc-gold">harish</span>  <span class="oc-dim">1.4G</span>  Jan 2025  <span class="oc-wht">react.js</span>` },
      { t: `<span class="oc-grn">-rwxr-xr-x</span>  <span class="oc-gold">harish</span>  <span class="oc-dim">1.2G</span>  Jan 2025  <span class="oc-wht">node.js</span>` },
      { t: `<span class="oc-grn">-rwxr-xr-x</span>  <span class="oc-gold">harish</span>  <span class="oc-dim">988M</span>  Jan 2025  <span class="oc-wht">python.py</span>` },
      { t: `<span class="oc-grn">-rwxr-xr-x</span>  <span class="oc-gold">harish</span>  <span class="oc-dim">2.1G</span>  Jan 2025  <span class="oc-wht">ai-ml.model</span>` },
      { t: `<span class="oc-grn">-rwxr-xr-x</span>  <span class="oc-gold">harish</span>  <span class="oc-dim">3.8G</span>  Jan 2025  <span class="oc-wht">fullstack.dev</span>` },
      { t: `<span class="oc-grn">-rwxr-xr-x</span>  <span class="oc-gold">harish</span>  <span class="oc-dim">∞∞∞∞</span>  Jan 2025  <span class="oc-gold">creativity</span>` },
    ]
  },
  {
    cmd: 'sudo ./awaken_portfolio.sh',
    delay: 44,
    output: [
      { t: `<span class="oc-dim">[sudo] password for harish: </span><span class="oc-dim">••••••••</span>`, pause: 500 },
      { t: `<span class="oc-wht">Authenticating identity</span><span class="oc-dim">............</span><span class="oc-grn"> ✓ VERIFIED</span>`, pause: 180 },
      { t: `<span class="oc-wht">Loading visual engine   </span><span class="oc-dim">............</span><span class="oc-grn"> ✓ READY</span>`, pause: 180 },
      { t: `<span class="oc-wht">Mounting creative core  </span><span class="oc-dim">............</span><span class="oc-grn"> ✓ ACTIVE</span>`, pause: 180 },
      { t: `<span class="oc-bar">▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  COMPLETE</span>`, pause: 250 },
      { t: `<span class="oc-gold">ACCESS GRANTED. Launching identity...</span>` },
    ]
  },
];

async function typeText(el, text, speed) {
  el.textContent = '';
  for (const ch of text) {
    if (skipIntro) return;
    el.textContent += ch;
    await sleep(speed + Math.random() * 15);
  }
}

async function runTerminal() {
  const hist = $('term-history');
  const input = $('term-input');
  const cur = $('term-cur');

  for (const cmd of COMMANDS) {
    if (skipIntro) return;
    cur.style.opacity = '1';
    await typeText(input, cmd.cmd, cmd.delay);
    if (skipIntro) return;
    cur.style.opacity = '0';
    await sleep(120);

    const block = document.createElement('div');
    block.className = 'h-block';
    block.innerHTML = `<div class="h-cmd">${PROMPT_HTML}<span style="color:#eee;font-family:'JetBrains Mono',monospace;font-size:clamp(0.75rem,1.3vw,0.95rem)">${cmd.cmd}</span></div>`;
    hist.appendChild(block);
    input.textContent = '';

    await sleep(80);

    for (const line of cmd.output) {
      if (skipIntro) return;
      if (line.pause) await sleep(line.pause);
      const row = document.createElement('div');
      row.className = 'h-out';
      row.innerHTML = line.t;
      block.appendChild(row);
      await sleep(10);
      row.classList.add('show');
      await sleep(90);
    }

    await sleep(220);
    cur.style.opacity = '1';
  }

  await sleep(700);
  cur.style.opacity = '0';
}

/* ════════════════════════════════════════════════════════
   TERMINAL GLITCH TRANSITION
   ════════════════════════════════════════════════════════ */
function terminalGlitchTransition(term) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;';
  cv.width = innerWidth; cv.height = innerHeight;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  const TOTAL = 1100;
  const t0 = performance.now();
  const rbars = ['rgba(255,0,70,0.7)', 'rgba(0,220,255,0.7)', 'rgba(255,215,0,0.5)', 'rgba(255,255,255,0.45)'];
  const heroRevealAt = TOTAL * 0.35;
  let heroTriggered = false;

  return new Promise(resolve => {
    function frame(now) {
      const elapsed = now - t0;
      const prog = Math.min(elapsed / TOTAL, 1);
      ctx.clearRect(0, 0, W, H);

      if (!heroTriggered && elapsed >= heroRevealAt) {
        heroTriggered = true;
        term.style.transition = 'opacity 0.55s ease';
        term.style.opacity = '0';
        $('hero').classList.add('alive');
        phase = 'hero';
        $('grain').style.opacity = '0.033';
        $('dust').style.opacity = '1';
        $('spotlight').style.opacity = '1';
        $('geo').style.opacity = '0.85';
      }

      if (prog < 0.92) {
        const intensity = prog < 0.45 ? prog / 0.45 : 1 - (prog - 0.45) / 0.47;

        if (prog < 0.06) {
          ctx.fillStyle = `rgba(255,255,255,${(0.06 - prog) / 0.06 * 0.88})`;
          ctx.fillRect(0, 0, W, H);
        }

        const nBars = 5 + Math.floor(Math.random() * 10);
        for (let i = 0; i < nBars; i++) {
          const by = Math.random() * H, bh = Math.random() * 14 + 2;
          const bw = Math.random() * W * 0.8 + W * 0.1, bx = Math.random() * (W - bw);
          ctx.fillStyle = rbars[i % rbars.length];
          ctx.globalAlpha = intensity * (0.35 + Math.random() * 0.55);
          ctx.fillRect(bx, by, bw, bh);
        }

        const nRows = 3 + Math.floor(Math.random() * 6);
        for (let i = 0; i < nRows; i++) {
          const ry = Math.floor(Math.random() * H), rh = Math.floor(Math.random() * 6) + 1;
          const shx = (Math.random() - 0.5) * 55 * intensity;
          ctx.fillStyle = 'rgba(255,0,60,0.25)'; ctx.globalAlpha = intensity;
          ctx.fillRect(shx, ry, W, rh);
          ctx.fillStyle = 'rgba(0,220,255,0.25)';
          ctx.fillRect(-shx * 0.7, ry, W, rh);
        }

        ctx.globalAlpha = intensity * 0.08;
        for (let y = 0; y < H; y += 3) {
          if (Math.random() > 0.55) {
            ctx.fillStyle = `rgba(255,200,0,${Math.random() * 0.35})`;
            ctx.fillRect(0, y, W, 1);
          }
        }

        if (Math.random() > 0.5) {
          const px = Math.random() * W, py = Math.random() * H;
          const pw = Math.random() * 180 + 20, ph = Math.random() * 40 + 4;
          ctx.fillStyle = Math.random() > 0.5
            ? `rgba(255,215,0,${Math.random() * 0.3})`
            : `rgba(0,0,0,${Math.random() * 0.6})`;
          ctx.globalAlpha = intensity;
          ctx.fillRect(px, py, pw, ph);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, W, H);
        cv.remove();
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

/* ════════════════════════════════════════════════════════
   GOLDEN PARTICLE NAME ASSEMBLY
   ─────────────────────────────────────────────────────
   The name "HARISH" is rasterised on an offscreen canvas.
   Every lit pixel becomes a particle's target position.
   Particles spawn from the screen edges and fly inward,
   forming the letter shapes from golden dots.
   After assembly → canvas glitch burst → crossfade to
   HTML text → CSS shimmer + looping glitch forever.
   ════════════════════════════════════════════════════════ */
async function particleAssembleName() {
  const nameEl = $('the-name');
  const W = innerWidth, H = innerHeight;

  // HTML name stays invisible during particle phase
  nameEl.style.opacity = '0';

  // ── Step 1: Rasterise "HARISH" at real screen size ────
  const nameRect = nameEl.getBoundingClientRect();
  const fontSize = parseFloat(getComputedStyle(nameEl).fontSize);
  const ltrSpc = fontSize * 0.18; // mirror CSS letter-spacing: 0.18em

  const offW = Math.ceil(nameRect.width) + 60;
  const offH = Math.ceil(nameRect.height) + 60;
  const off = Object.assign(document.createElement('canvas'), { width: offW, height: offH });
  const offCtx = off.getContext('2d');

  offCtx.fillStyle = '#fff';
  offCtx.font = `700 ${fontSize}px "Cinzel Decorative", serif`;
  offCtx.textBaseline = 'top';
  offCtx.textAlign = 'left';

  // Draw each letter manually to apply letter-spacing
  let penX = 20;
  for (const ch of ['H', 'A', 'R', 'I', 'S', 'H']) {
    offCtx.fillText(ch, penX, 20);
    penX += offCtx.measureText(ch).width + ltrSpc;
  }

  // ── Step 2: Sample lit pixels → particle targets ───────
  const ox = nameRect.left - 20; // offscreen → screen offset
  const oy = nameRect.top - 20;
  const imgData = offCtx.getImageData(0, 0, offW, offH).data;
  const pixTargets = [];
  const STEP = MOBILE ? 5 : 4;
  for (let py = 0; py < offH; py += STEP) {
    for (let px = 0; px < offW; px += STEP) {
      if (imgData[(py * offW + px) * 4 + 3] > 60) {
        pixTargets.push({ tx: ox + px, ty: oy + py });
      }
    }
  }

  // Shuffle so particles come from all directions uniformly
  for (let i = pixTargets.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pixTargets[i], pixTargets[j]] = [pixTargets[j], pixTargets[i]];
  }
  pixTargets.length = Math.min(pixTargets.length, MOBILE ? 800 : 1500); // perf cap

  // ── Step 3: Build particle objects ────────────────────
  const GOLD_RGB = [
    [255, 215, 0],
    [255, 190, 0],
    [255, 235, 80],
    [255, 245, 140],
    [200, 150, 0],
  ];

  function randEdge() {
    const side = (Math.random() * 4) | 0;
    if (side === 0) return { sx: Math.random() * W, sy: -30 };
    if (side === 1) return { sx: W + 30, sy: Math.random() * H };
    if (side === 2) return { sx: Math.random() * W, sy: H + 30 };
    return { sx: -30, sy: Math.random() * H };
  }

  const particles = pixTargets.map(pt => {
    const { sx, sy } = randEdge();
    const col = GOLD_RGB[(Math.random() * GOLD_RGB.length) | 0];
    return {
      sx, sy, x: sx, y: sy,
      tx: pt.tx + (Math.random() - 0.5) * 1.2,
      ty: pt.ty + (Math.random() - 0.5) * 1.2,
      r: Math.random() * 0.9 + 0.55,
      col,
      delay: Math.random() * 650, // stagger spawn over 650ms
    };
  });

  // ── Step 4: Main canvas (viewport-sized) ──────────────
  const cv = Object.assign(document.createElement('canvas'), { width: W, height: H });
  cv.style.cssText = 'position:fixed;inset:0;z-index:500;pointer-events:none;';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.globalCompositeOperation = 'lighter'; // additive glow — cheaper than gradients

  const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

  const TRAVEL_MS = 1500;
  const t0 = performance.now();

  // ── Phase A: Particles fly from edges → letter shapes ─
  await new Promise(resolve => {
    function frame(now) {
      const elapsed = now - t0;
      ctx.clearRect(0, 0, W, H);
      let pending = false;

      for (const p of particles) {
        const pe = elapsed - p.delay;
        if (pe < 0) { pending = true; continue; }

        const raw = Math.min(pe / TRAVEL_MS, 1);
        const ease = easeOutExpo(raw);
        p.x = p.sx + (p.tx - p.sx) * ease;
        p.y = p.sy + (p.ty - p.sy) * ease;
        if (raw < 1) pending = true;

        const [r, g, b] = p.col;
        const speed = 1 - ease;

        // Comet trail — one cheap line stroke instead of an arc chain
        if (raw < 0.88 && speed > 0.05) {
          const ndx = p.tx - p.sx, ndy = p.ty - p.sy;
          const dist = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
          const tl = speed * 16;
          ctx.beginPath();
          ctx.moveTo(p.x - (ndx / dist) * tl, p.y - (ndy / dist) * tl);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.3 * speed})`;
          ctx.lineWidth = p.r;
          ctx.stroke();
        }

        // Core particle (additive blending provides the glow)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${raw > 0.93 ? 0.75 : 0.92})`;
        ctx.fill();
      }

      if (!pending) { resolve(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // ── Phase B: Assembled — hold clean ──────

  function drawStable(shiftR = 0, shiftC = 0, glitchA = 0, scanline = false) {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      const [r, g, b] = p.col;

      // Core gold dot at locked position
      ctx.beginPath();
      ctx.arc(p.tx, p.ty, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.88)`;
      ctx.fill();

      // Chromatic ghost copies during glitch frames
      if (glitchA > 0) {
        ctx.beginPath();
        ctx.arc(p.tx + shiftR, p.ty, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,0,80,${glitchA})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.tx + shiftC, p.ty, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,220,255,${glitchA})`;
        ctx.fill();
      }
    }

    // Horizontal scanline tear across name area
    if (scanline) {
      const sy = nameRect.top + Math.random() * nameRect.height;
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.fillRect(nameRect.left - 20, sy, nameRect.width + 40, 2 + Math.random() * 4);
    }
  }

  drawStable();
  await sleep(380);

  // ── Phase C: Glitch burst sequence on particle name ───
  const glitchFrames = [
    { r: 13, c: -9, a: 0.88, sl: true, ms: 55 },
    { r: -11, c: 7, a: 0.72, sl: false, ms: 45 },
    { r: 0, c: 0, a: 0.00, sl: false, ms: 35 }, // clean
    { r: 8, c: -5, a: 0.55, sl: true, ms: 50 },
    { r: -5, c: 3, a: 0.32, sl: false, ms: 40 },
    { r: 2, c: -1, a: 0.14, sl: false, ms: 35 },
    { r: 0, c: 0, a: 0.00, sl: false, ms: 45 }, // settle
  ];
  for (const f of glitchFrames) {
    drawStable(f.r, f.c, f.a, f.sl);
    await sleep(f.ms);
  }
  drawStable(); // clean hold

  await sleep(480); // let particle name sit visible before dissolve

  // ── Phase D: Crossfade canvas → CSS shimmer HTML name ─
  nameEl.classList.add('revealed');        // arm shimmer + glitch-loop
  nameEl.style.transition = 'opacity 0.5s ease';
  nameEl.style.opacity = '1';
  cv.style.transition = 'opacity 0.5s ease';
  cv.style.opacity = '0';
  await sleep(550);
  cv.remove();

  // ── Phase E: Final chromatic impact on HTML name ──────
  nameEl.style.filter =
    'drop-shadow(0 0 55px rgba(255,215,0,1)) ' +
    'drop-shadow(12px 0 rgba(255,0,80,0.88)) ' +
    'drop-shadow(-12px 0 rgba(0,220,255,0.88))';
  await sleep(90);
  nameEl.style.filter = 'drop-shadow(0 0 28px rgba(255,215,0,0.55))';
  await sleep(120);
  nameEl.style.filter = '';
  // CSS name-glitch-loop now runs indefinitely via .revealed class
}

/* ════════════════════════════════════════════════════════
   GLITCH ASSEMBLY — hero elements snap in one by one
   ════════════════════════════════════════════════════════ */
async function glitchAssemble(el, showClass, delay = 0) {
  await sleep(delay);
  el.classList.add(showClass);
  el.classList.add('glitch-assemble');
  await sleep(380);
  el.classList.remove('glitch-assemble');
}

/* ════════════════════════════════════════════════════════
   ROLE ROTATOR
   ════════════════════════════════════════════════════════ */
const ROLES = ['FULL STACK DEVELOPER', 'AI BUILDER', 'PROBLEM SOLVER', 'CREATIVE ENGINEER'];
let ri = 0;

async function spinRoles() {
  const el = $('role-txt');
  await sleep(2800);
  while (true) {
    el.className = 'up';
    await sleep(360);
    ri = (ri + 1) % ROLES.length;
    el.textContent = ROLES[ri];
    el.className = 'dn';
    await sleep(40);
    el.getBoundingClientRect();
    el.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity .45s ease,transform .45s ease';
    await sleep(2800);
    el.style.cssText = '';
  }
}

/* ════════════════════════════════════════════════════════
   INTRO COMPLETION / SKIP / REDUCED-MOTION PATHS
   ════════════════════════════════════════════════════════ */
function finishIntro() {
  if (introDone) return;
  introDone = true;
  phase = 'hero';
  document.body.classList.remove('locked');
  const nav = $('topnav');
  if (nav) nav.classList.add('show');
  const sk = $('skip-intro');
  if (sk) sk.remove();
}

function instantReveal() {
  const term = $('terminal');
  if (term) term.remove();
  $('hero').classList.add('alive');
  $('grain').style.opacity = '0.033';
  $('dust').style.opacity = '1';
  $('spotlight').style.opacity = '1';
  $('geo').style.opacity = '0.85';
  const name = $('the-name');
  name.classList.add('revealed');
  name.style.opacity = '1';
  ['role-row', 'tagline', 'btns'].forEach(id => { const el = $(id); if (el) el.classList.add('show'); });
  document.querySelectorAll('.cf').forEach(el => el.classList.add('show'));
  $('scroll-cue').classList.add('show');
  finishIntro();
  if (!REDUCED) spinRoles();
}

const skipBtn = $('skip-intro');
if (skipBtn) skipBtn.addEventListener('click', () => {
  skipIntro = true;
  instantReveal();
});



/* ════════════════════════════════════════════════════════
   MASTER AWAKENING SEQUENCE
   ════════════════════════════════════════════════════════ */
async function awaken() {

  // Accessibility fast path — no cinematic intro
  if (REDUCED) { instantReveal(); return; }

  if (skipBtn) skipBtn.classList.add('show');

  // Scene 1: brief darkness before terminal
  await sleep(400);
  if (skipIntro) return;

  // Scene 2: terminal
  await runTerminal();
  if (skipIntro) return;

  // Scene 3: glitch transition
  const term = $('terminal');
  await terminalGlitchTransition(term);
  if (skipIntro) return;

  // Scene 4: particle name assembly
  await sleep(60);
  await particleAssembleName();

  // Scene 5: camera depth pulse
  $('hero-center').classList.add('depth');
  await sleep(300);

  // Scene 6: rest of hero assembles
  $('role-txt').textContent = 'FULL STACK DEVELOPER';
  glitchAssemble($('role-row'), 'show');

  document.querySelectorAll('.cf').forEach((el, i) =>
    setTimeout(() => el.classList.add('show'), 200 + i * 320)
  );

  await sleep(380);
  await glitchAssemble($('tagline'), 'show');
  await glitchAssemble($('btns'), 'show', 60);

  await sleep(180);
  $('scroll-cue').classList.add('show');

  spinRoles();
  if (!skipIntro) term.remove();
  finishIntro();
}

awaken();

/* ════════════════════════════════════════════════════════
   SITE — scroll reveals, nav, tilt cards
   ════════════════════════════════════════════════════════ */

// ── Scroll-triggered reveals ───────────────────────────
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('in');
      revealIO.unobserve(en.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

// ── Active nav link tracking ───────────────────────────
const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
const sectionIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      navLinks.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id)
      );
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionIO.observe(s));

// ── Mobile drawer ──────────────────────────────────────
const burger = $('nav-burger'), links = $('nav-links');
if (burger && links) {
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));
}

// ── Hide scroll cue + velocity-reactive scroll whoosh ────
let lastScrollY = scrollY;
window.addEventListener('scroll', () => {
  const sc = $('scroll-cue');
  if (sc) sc.classList.toggle('hide', scrollY > 60);
  lastScrollY = scrollY;
}, { passive: true });

// ── 3D tilt + glow-follow on project cards ─────────────
if (FINE && !REDUCED) {
  document.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--px', (x * 100) + '%');
      card.style.setProperty('--py', (y * 100) + '%');
      card.style.transform =
        `perspective(800px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ── Footer year ────────────────────────────────────────
const yr = $('yr');
if (yr) yr.textContent = new Date().getFullYear();
