/* ============================================================
   MINIGAMES — how Chad fixes a $90,000 vehicle with his hands
   Each: MINI.run(type, host, issue, done)  ->  done(true|false)
   ============================================================ */
'use strict';

const MINI = {};

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* shared chrome: instruction line + countdown bar */
function mgFrame(host, title, hint, seconds, onTimeout) {
  host.innerHTML = '';
  const wrap = el('div', 'mg');
  const h = el('div', 'mg-title', title);
  const s = el('div', 'mg-hint', hint);
  const barOuter = el('div', 'mg-timer');
  const bar = el('div', 'mg-timer-fill');
  barOuter.appendChild(bar);
  const body = el('div', 'mg-body');
  wrap.append(h, s, barOuter, body);
  host.appendChild(wrap);

  const t0 = performance.now();
  const total = seconds * 1000;
  let done = false, raf = 0;
  function tick() {
    const left = Math.max(0, total - (performance.now() - t0));
    bar.style.width = (left / total * 100) + '%';
    bar.style.background = left / total < 0.3 ? '#ff4d4d' : (left/total < 0.6 ? '#ffb020' : '#43d17a');
    if (left <= 0) { if (!done) { done = true; onTimeout(); } return; }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return { body, stop() { done = true; cancelAnimationFrame(raf); }, isDone() { return done; } };
}

function finishOnce(f, fn) { let used = false; return (ok) => { if (used) return; used = true; f.stop(); fn(ok); }; }

/* ---------- 1. MASH: hit the thing until the thing works ---------- */
MINI.mash = function (host, issue, done) {
  const need = 18, secs = 6;
  const f = mgFrame(host, issue.mgTitle || 'MASH IT', issue.mgHint || 'Tap as fast as humanly possible', secs, () => fin(false));
  const fin = finishOnce(f, done);
  let n = 0;
  const count = el('div', 'mg-count', '0 / ' + need);
  const btn = el('button', 'mg-bigbtn', issue.mgIcon || '🔧');
  const bar = el('div', 'mg-prog'); const fill = el('div', 'mg-prog-fill'); bar.appendChild(fill);
  f.body.append(count, btn, bar);
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (f.isDone()) return;
    n++;
    SFX.tick(); if (n % 4 === 0) SFX.ratchet();
    count.textContent = n + ' / ' + need;
    fill.style.width = Math.min(100, n / need * 100) + '%';
    btn.style.transform = 'scale(' + (0.88 + Math.random()*0.06) + ') rotate(' + (Math.random()*16-8) + 'deg)';
    setTimeout(() => btn.style.transform = '', 70);
    if (n >= need) fin(true);
  });
};

/* ---------- 2. SWIPE: manual windshield operation ---------- */
MINI.swipe = function (host, issue, done) {
  const need = 6, secs = 10;
  const f = mgFrame(host, issue.mgTitle || 'MANUAL WIPER MODE', issue.mgHint || 'Swipe left and right across the glass', secs, () => fin(false));
  const fin = finishOnce(f, done);
  let n = 0, lastDir = 0, startX = null;
  const count = el('div', 'mg-count', '0 / ' + need);
  const pane = el('div', 'mg-pane', '<div class="mg-glass"></div>');
  const blade = el('div', 'mg-blade');
  const rain = el('div', 'mg-rain', '💧💧💧💧💧');
  pane.append(rain, blade);
  f.body.append(count, pane);

  function localX(e) {
    const p = APP.localPoint(pane, e.clientX, e.clientY);
    return p.x / Math.max(1, pane.offsetWidth);
  }
  pane.addEventListener('pointerdown', e => { e.preventDefault(); pane.setPointerCapture(e.pointerId); startX = localX(e); });
  pane.addEventListener('pointermove', e => {
    if (startX === null || f.isDone()) return;
    const x = localX(e);
    blade.style.left = (Math.max(0, Math.min(1, x)) * 100) + '%';
    const dx = x - startX;
    if (Math.abs(dx) > 0.55) {
      const dir = dx > 0 ? 1 : -1;
      if (dir !== lastDir) {
        lastDir = dir; n++; startX = x;
        SFX.wiper();
        count.textContent = n + ' / ' + need;
        rain.style.opacity = String(Math.max(0, 1 - n / need));
        if (n >= need) fin(true);
      }
    }
  });
  pane.addEventListener('pointerup', () => { startX = null; });
  pane.addEventListener('pointercancel', () => { startX = null; });
};

/* ---------- 3. MATCH: find the matching parts ---------- */
MINI.match = function (host, issue, done) {
  const icons = issue.mgIcons || ['❄️','🔩','🔌','🧊','🌀','🔋'];
  const pool = icons.slice(0, 4);
  const cards = pool.concat(pool).sort(() => Math.random() - 0.5);
  const f = mgFrame(host, issue.mgTitle || 'MATCH THE PARTS', issue.mgHint || 'Find all 4 matching pairs', 22, () => fin(false));
  const fin = finishOnce(f, done);
  const grid = el('div', 'mg-grid');
  f.body.appendChild(grid);
  let open = [], lock = false, matched = 0;
  cards.forEach((ic) => {
    const c = el('button', 'mg-card', '<span>' + ic + '</span>');
    c.dataset.icon = ic;
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (lock || f.isDone() || c.classList.contains('flip') || c.classList.contains('got')) return;
      c.classList.add('flip'); SFX.pop(); open.push(c);
      if (open.length === 2) {
        lock = true;
        const [a, b] = open;
        if (a.dataset.icon === b.dataset.icon) {
          setTimeout(() => {
            a.classList.add('got'); b.classList.add('got'); SFX.ding();
            open = []; lock = false; matched++;
            if (matched === pool.length) fin(true);
          }, 240);
        } else {
          setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); SFX.error(); open = []; lock = false; }, 620);
        }
      }
    });
    grid.appendChild(c);
  });
};

/* ---------- 4. TIMING: stop the needle in the green ---------- */
MINI.timing = function (host, issue, done) {
  const need = 3;
  const f = mgFrame(host, issue.mgTitle || 'STOP IN THE GREEN', issue.mgHint || 'Tap when the marker hits the green zone', 16, () => fin(false));
  const fin = finishOnce(f, done);
  let hits = 0, pos = 0, dir = 1, speed = 0.85, zoneW = 0.24, zone = 0.4, raf;
  const count = el('div', 'mg-count', '0 / ' + need);
  const track = el('div', 'mg-track');
  const green = el('div', 'mg-zone');
  const marker = el('div', 'mg-marker');
  track.append(green, marker);
  const btn = el('button', 'mg-btn', 'STOP');
  f.body.append(count, track, btn);
  let last = performance.now();
  function place() {
    green.style.left = (zone * 100) + '%'; green.style.width = (zoneW * 100) + '%';
    marker.style.left = (pos * 100) + '%';
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (f.isDone()) return;
    pos += dir * speed * dt;
    if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
    place(); raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (f.isDone()) return;
    if (pos >= zone && pos <= zone + zoneW) {
      hits++; SFX.ding(); count.textContent = hits + ' / ' + need;
      track.classList.add('good'); setTimeout(() => track.classList.remove('good'), 180);
      if (hits >= need) { cancelAnimationFrame(raf); return fin(true); }
      speed += 0.35; zoneW = Math.max(0.13, zoneW - 0.035); zone = 0.08 + Math.random() * (1 - zoneW - 0.16);
    } else {
      SFX.bonk(); track.classList.add('bad'); setTimeout(() => track.classList.remove('bad'), 180);
      speed = Math.max(0.6, speed - 0.1);
    }
  });
  place();
};

/* ---------- 5. HOLD: pour / pressurize, release in the band ---------- */
MINI.hold = function (host, issue, done) {
  const need = 2;
  const f = mgFrame(host, issue.mgTitle || 'FILL TO THE LINE', issue.mgHint || 'Hold to fill — release inside the green band', 16, () => fin(false));
  const fin = finishOnce(f, done);
  let rounds = 0, v = 0, holding = false, raf, lo = 0.62, hi = 0.82;
  const count = el('div', 'mg-count', '0 / ' + need);
  const tube = el('div', 'mg-tube');
  const band = el('div', 'mg-band');
  const fill = el('div', 'mg-tube-fill');
  tube.append(fill, band);
  const btn = el('button', 'mg-btn hold', 'HOLD');
  f.body.append(count, tube, btn);
  function bands() { band.style.bottom = (lo*100)+'%'; band.style.height = ((hi-lo)*100)+'%'; }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last)/1000); last = now;
    if (f.isDone()) return;
    if (holding) { v = Math.min(1.12, v + dt * 0.58); }
    fill.style.height = (Math.min(1, v) * 100) + '%';
    fill.style.background = (v >= lo && v <= hi) ? 'linear-gradient(180deg,#5ef08f,#1f9e55)' : 'linear-gradient(180deg,#ffd166,#e8871a)';
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); if (f.isDone()) return; holding = true; SFX.glug(); btn.classList.add('down'); });
  const release = (e) => {
    if (!holding || f.isDone()) return;
    if (e) e.preventDefault();
    holding = false; btn.classList.remove('down');
    if (v >= lo && v <= hi) {
      rounds++; SFX.ding(); count.textContent = rounds + ' / ' + need;
      if (rounds >= need) { cancelAnimationFrame(raf); return fin(true); }
      v = 0; lo = 0.5 + Math.random()*0.28; hi = lo + 0.15; bands();
    } else { SFX.error(); v = 0; }
  };
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
  bands();
};

/* ---------- 6. DOTS: stitching, taping, generally improvising ---------- */
MINI.dots = function (host, issue, done) {
  const n = 8;
  const f = mgFrame(host, issue.mgTitle || 'STITCH IT UP', issue.mgHint || 'Tap the numbers in order — no skipping', 14, () => fin(false));
  const fin = finishOnce(f, done);
  const pane = el('div', 'mg-pane dots');
  f.body.appendChild(pane);
  let next = 1;
  const pts = [];
  for (let i=0;i<n;i++){
    const t = i/(n-1);
    pts.push({ x: 10 + t*78 + (Math.random()-0.5)*8, y: 18 + Math.sin(t*Math.PI*1.6)*26 + (Math.random()-0.5)*22 });
  }
  pts.forEach((p, i) => {
    const d = el('button', 'mg-dot', String(i+1));
    d.style.left = p.x + '%'; d.style.top = Math.max(6, Math.min(80, p.y)) + '%';
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (f.isDone()) return;
      if (i+1 === next) {
        d.classList.add('got'); SFX.tick(); SFX.squeak(); next++;
        if (next > n) { SFX.success(); fin(true); }
      } else { SFX.error(); d.classList.add('shake'); setTimeout(()=>d.classList.remove('shake'),300); }
    });
    pane.appendChild(d);
  });
  pane.insertAdjacentHTML('afterbegin', '<div class="mg-crack"></div>');
};

/* ---------- 7. WHACK: dashboard gremlins ---------- */
MINI.whack = function (host, issue, done) {
  const need = 10;
  const f = mgFrame(host, issue.mgTitle || 'DASH GREMLINS', issue.mgHint || 'Tap every warning light before it escapes', 14, () => fin(false));
  const fin = finishOnce(f, done);
  let hit = 0, alive = true;
  const count = el('div', 'mg-count', '0 / ' + need);
  const grid = el('div', 'mg-holes');
  f.body.append(count, grid);
  const lamps = ['🚨','⚠️','🔋','🛢️','🌡️','🛑','💡','⛽'];
  const cells = [];
  for (let i=0;i<9;i++){ const c = el('div','mg-hole'); grid.appendChild(c); cells.push(c); }
  function popOne() {
    if (!alive || f.isDone()) return;
    const c = cells[(Math.random()*cells.length)|0];
    if (c.firstChild) { setTimeout(popOne, 160); return; }
    const b = el('button','mg-lamp', lamps[(Math.random()*lamps.length)|0]);
    c.appendChild(b); SFX.beep();
    const life = setTimeout(() => { if (b.parentNode) { b.remove(); SFX.error(); } }, 900);
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); if (f.isDone()) return;
      clearTimeout(life); b.remove(); hit++; SFX.pop();
      count.textContent = hit + ' / ' + need;
      if (hit >= need) { alive = false; fin(true); }
    });
    setTimeout(popOne, 320 + Math.random()*300);
  }
  popOne(); setTimeout(popOne, 500);
};

/* ---------- 8. SIMON: reprogram the infotainment ---------- */
MINI.simon = function (host, issue, done) {
  const f = mgFrame(host, issue.mgTitle || 'REBOOT SEQUENCE', issue.mgHint || 'Watch the sequence, then repeat it', 26, () => fin(false));
  const fin = finishOnce(f, done);
  const colors = ['#e5484d','#f5a623','#30a46c','#3b82f6'];
  const tones = [329, 415, 523, 659];
  const pad = el('div','mg-simon');
  const status = el('div','mg-count','WATCH…');
  f.body.append(status, pad);
  const btns = colors.map((c,i) => {
    const b = el('button','mg-simon-b');
    b.style.background = c;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(i); });
    pad.appendChild(b); return b;
  });
  let seq = [], idx = 0, accepting = false, round = 0;
  function flash(i, ms) {
    btns[i].classList.add('lit'); SFX._osc('sine', tones[i], tones[i], 0.22, 0.25);
    setTimeout(() => btns[i].classList.remove('lit'), ms || 280);
  }
  function play() {
    accepting = false; status.textContent = 'WATCH…';
    seq.forEach((v, k) => setTimeout(() => flash(v), 420 + k*480));
    setTimeout(() => { accepting = true; idx = 0; status.textContent = 'YOUR TURN'; }, 420 + seq.length*480);
  }
  function next() {
    round++;
    if (round > 3) return fin(true);
    seq.push((Math.random()*4)|0);
    play();
  }
  function press(i) {
    if (!accepting || f.isDone()) return;
    flash(i, 160);
    if (seq[idx] === i) {
      idx++;
      if (idx === seq.length) { accepting = false; SFX.ding(); setTimeout(next, 520); }
    } else { SFX.error(); accepting = false; status.textContent = 'NOPE. AGAIN.'; setTimeout(play, 800); }
  }
  next();
};

/* ---------- 9. TAPE: duct tape is a structural component ---------- */
MINI.tape = function (host, issue, done) {
  const need = 3;
  const f = mgFrame(host, issue.mgTitle || 'APPLY DUCT TAPE', issue.mgHint || 'Drag all the way across the crack — 3 strips', 14, () => fin(false));
  const fin = finishOnce(f, done);
  let strips = 0, dragging = false, startX = 0, reached = false;
  const count = el('div','mg-count','0 / ' + need);
  const pane = el('div','mg-pane tape', '<div class="mg-crack big"></div>');
  const roll = el('div','mg-roll','🩹');
  pane.appendChild(roll);
  f.body.append(count, pane);
  function lx(e) { return APP.localPoint(pane, e.clientX, e.clientY).x / Math.max(1, pane.offsetWidth); }
  pane.addEventListener('pointerdown', e => {
    e.preventDefault(); pane.setPointerCapture(e.pointerId);
    startX = lx(e); dragging = startX < 0.35; reached = false;
    if (!dragging) SFX.error();
  });
  pane.addEventListener('pointermove', e => {
    if (!dragging || f.isDone()) return;
    const x = Math.max(0, Math.min(1, lx(e)));
    roll.style.left = (x*100) + '%';
    if (x > 0.82 && !reached) {
      reached = true; dragging = false; strips++;
      SFX.squeak(); SFX.tick();
      const s = el('div','mg-strip');
      s.style.top = (22 + strips*16) + '%';
      s.style.transform = 'rotate(' + ((Math.random()*10)-5) + 'deg)';
      pane.appendChild(s);
      count.textContent = strips + ' / ' + need;
      roll.style.left = '6%';
      if (strips >= need) { SFX.success(); fin(true); }
    }
  });
  const up = () => { dragging = false; };
  pane.addEventListener('pointerup', up);
  pane.addEventListener('pointercancel', up);
};

/* ---------- 10. BALANCE: hold the wheel straight ---------- */
MINI.balance = function (host, issue, done) {
  const hold = 6.0;
  const f = mgFrame(host, issue.mgTitle || 'HOLD IT STEADY', issue.mgHint || 'Tap ◀ / ▶ to keep the wheel centered', 15, () => fin(false));
  const fin = finishOnce(f, done);
  let ang = 0, vel = 0, safe = 0, raf;
  const meter = el('div','mg-count','STEADY: 0%');
  const wheelWrap = el('div','mg-wheelwrap');
  const wheel = el('div','mg-wheel','🎡');
  const zoneL = el('div','mg-safe');
  wheelWrap.append(zoneL, wheel);
  const row = el('div','mg-row');
  const L = el('button','mg-btn sm','◀');
  const R = el('button','mg-btn sm','▶');
  row.append(L, R);
  f.body.append(meter, wheelWrap, row);
  L.addEventListener('pointerdown', e => { e.preventDefault(); vel -= 42; SFX.tick(); });
  R.addEventListener('pointerdown', e => { e.preventDefault(); vel += 42; SFX.tick(); });
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now-last)/1000); last = now;
    if (f.isDone()) return;
    vel += (Math.random()-0.5) * 190 * dt + (ang > 0 ? 22 : -22) * dt;
    vel *= 0.965;
    ang += vel * dt;
    if (Math.abs(ang) > 46) { ang = Math.sign(ang)*46; vel *= -0.4; SFX.bonk(); safe = Math.max(0, safe - 0.5); }
    wheel.style.transform = 'rotate(' + (ang*2.4) + 'deg) translateX(' + (ang*1.6) + 'px)';
    const inZone = Math.abs(ang) < 13;
    wheelWrap.classList.toggle('ok', inZone);
    if (inZone) safe += dt; 
    meter.textContent = 'STEADY: ' + Math.round(Math.min(1, safe/hold)*100) + '%';
    if (safe >= hold) { cancelAnimationFrame(raf); SFX.success(); return fin(true); }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
};

MINI.run = function (type, host, issue, done) {
  (MINI[type] || MINI.mash)(host, issue, done);
};
