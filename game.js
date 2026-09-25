/* ============================================================
   CHAD'S RANGE ROVER — game logic
   ============================================================ */
'use strict';

const CHAD_LINES = [
  'Oh God', 'Oh no', 'Not again!', 'This Range Rover I swear!',
  'God help us', 'God help me', 'Hang on tight!'
];

const ISSUES = [
  { id:'wipers',  icon:'🌧️', name:'WIPERS QUIT',        sub:'Mid-blizzard. Of course.',                 mg:'swipe',  mgTitle:'MANUAL WIPER MODE', mgHint:'Swipe left and right across the glass', debris:0 },
  { id:'flat',    icon:'🛞', name:'FLAT TIRE',           sub:'All-terrain. Zero terrain survived.',      mg:'mash',   mgTitle:'CRANK THE JACK',    mgHint:'Tap to pump the jack', mgIcon:'🔧', flat:true, debris:1 },
  { id:'ac',      icon:'❄️', name:'A/C DIED',            sub:'It is 9°F. The A/C is stuck ON.',          mg:'match',  mgTitle:'FIND THE MATCHING FUSES', mgHint:'Match 4 pairs before you freeze', mgIcons:['❄️','🔌','🧊','🌀'] },
  { id:'brakes',  icon:'🛑', name:'BRAKES FADING',       sub:'The pedal went all the way down. All of it.', mg:'timing', mgTitle:'PUMP THE BRAKES', mgHint:'Tap exactly in the green zone ×3' },
  { id:'sunroof', icon:'🪟', name:'SUNROOF CRACKED',     sub:'A panoramic view of your problems.',       mg:'tape',   mgTitle:'DUCT TAPE THE SUNROOF', mgHint:'Drag tape all the way across ×3', debris:5 },
  { id:'seat',    icon:'🪡', name:'SEAT TORE OPEN',      sub:'Genuine leather. Genuinely gone.',         mg:'dots',   mgTitle:'STITCH THE SEAT', mgHint:'Tap the numbers in order' },
  { id:'belt',    icon:'🔗', name:'SEATBELT LOOSE',      sub:'It is more of a suggestion now.',          mg:'hold',   mgTitle:'TENSION THE BELT', mgHint:'Hold to tighten — release in the green band' },
  { id:'oil',     icon:'🛢️', name:'OUT OF OIL',          sub:'It drank 4 quarts since Tuesday.',         mg:'hold',   mgTitle:'POUR THE OIL', mgHint:'Hold to pour — release in the green band', smoke:true },
  { id:'engine',  icon:'🚨', name:'CHECK ENGINE LIGHT',  sub:'And his friends. They all came.',          mg:'whack',  mgTitle:'DASH GREMLINS', mgHint:'Tap every warning light before it escapes', smoke:true },
  { id:'battery', icon:'🔋', name:'BATTERY DYING',       sub:'The heated cupholders did this.',          mg:'mash',   mgTitle:'CRANK IT OVER', mgHint:'Tap to turn the engine over', mgIcon:'🔑' },
  { id:'coolant', icon:'💧', name:'COOLANT LEAK',        sub:'Temperature gauge doing a little dance.',  mg:'hold',   mgTitle:'TOP UP THE COOLANT', mgHint:'Hold to pour — release in the green band', smoke:true },
  { id:'info',    icon:'📺', name:'INFOTAINMENT REBOOT', sub:'The screen is now a very expensive mirror.', mg:'simon', mgTitle:'REBOOT SEQUENCE', mgHint:'Watch the sequence, then repeat it' },
  { id:'fob',     icon:'🔑', name:'KEY FOB DEAD',        sub:'The car does not know who you are.',       mg:'simon',  mgTitle:'REPROGRAM THE FOB', mgHint:'Repeat the pairing sequence' },
  { id:'susp',    icon:'🔩', name:'AIR SUSPENSION CLUNK',sub:'It knelt. It will not stand back up.',     mg:'balance',mgTitle:'HOLD IT LEVEL', mgHint:'Tap ◀ / ▶ to keep it centered' },
  { id:'steer',   icon:'🎡', name:'STEERING SHAKE',      sub:'The wheel is doing its own thing.',        mg:'balance',mgTitle:'HOLD THE WHEEL', mgHint:'Tap ◀ / ▶ to keep it centered' },
  { id:'mirror',  icon:'🪞', name:'MIRROR FLAPPING',     sub:'Waving goodbye at 60 mph.',                mg:'tape',   mgTitle:'TAPE THE MIRROR ON', mgHint:'Drag tape across ×3', debris:3 },
  { id:'exhaust', icon:'🔥', name:'EXHAUST DRAGGING',    sub:'Showering the highway in sparks.',         mg:'tape',   mgTitle:'TAPE THE EXHAUST', mgHint:'Drag tape across ×3', debris:4 },
  { id:'door',    icon:'🚪', name:'DOOR WON\'T SHUT',    sub:'It closes. It just does not stay closed.', mg:'mash',   mgTitle:'SLAM IT', mgHint:'Tap to slam the door', mgIcon:'🚪', debris:2 },
  { id:'trans',   icon:'⚙️', name:'TRANSMISSION SLIPPING',sub:'Gear 4 is now theoretical.',              mg:'timing', mgTitle:'SHIFT IN THE GREEN', mgHint:'Tap in the green zone ×3' },
  { id:'heat',    icon:'🪑', name:'HEATED SEATS MAX',    sub:'Stuck on 11. Chad is being toasted.',      mg:'timing', mgTitle:'KILL THE SEAT HEATER', mgHint:'Tap in the green zone ×3' },
  { id:'leak',    icon:'☔', name:'ROOF LEAKING INSIDE', sub:'It is raining. In the cabin.',             mg:'dots',   mgTitle:'SEAL THE HEADLINER', mgHint:'Tap the numbers in order' },
  { id:'headlt',  icon:'💡', name:'HEADLIGHT OUT',       sub:'Adaptive matrix LED. Adaptively off.',     mg:'whack',  mgTitle:'RESET THE MODULES', mgHint:'Tap every fault before it escapes' },
  { id:'trunk',   icon:'📦', name:'TAILGATE OPENING',    sub:'The skis are now on the road.',            mg:'mash',   mgTitle:'SHUT THE TAILGATE', mgHint:'Tap to force it down', mgIcon:'📦', debris:5 },
  { id:'wash',    icon:'🧴', name:'WASHER FLUID FROZE',  sub:'The windshield is now opaque.',            mg:'swipe',  mgTitle:'SCRUB IT OFF', mgHint:'Swipe left and right across the glass' }
];

const JETTA_MUTTERS = [
  'It has heated seats. One of them.',
  'Nothing is wrong. Nothing has been wrong for forty minutes.',
  'I hate how fine it is.',
  'It gets thirty eight miles per gallon. Thirty eight.',
  'It just... works. Disgusting.',
  'I miss the noises.'
];

const APP = {
  stage: null, canvas: null, rot: 0, SW: 0, SH: 0, dpr: 1,
  state: 'menu', last: 0,
  progress: 0, condition: 100, speed: 0, targetSpeed: 0,
  issue: null, issuePhase: null, nextIssueIn: 6,
  fixed: 0, failed: 0, ignoredTime: 0, bumps: 0,
  flatWheel: -1, tint: 0, damageLook: false, cabinZ: null,
  breakT: 0, jettaMutterIn: 5, obstacleIn: 3, deck: [],
  started: false, muted: false
};

/* ---------- orientation: the screen refuses to rotate ---------- */
APP.layout = function () {
  const w = window.innerWidth, h = window.innerHeight;
  let angle = 0;
  if (window.screen && screen.orientation && typeof screen.orientation.angle === 'number') angle = screen.orientation.angle;
  else if (typeof window.orientation === 'number') angle = window.orientation;
  angle = ((angle % 360) + 360) % 360;

  const landscape = w > h;
  let rot = 0;
  if (landscape) rot = (angle === 270) ? 90 : -90;
  APP.rot = rot;
  APP.SW = landscape ? h : w;
  APP.SH = landscape ? w : h;

  const s = APP.stage;
  s.style.width = APP.SW + 'px';
  s.style.height = APP.SH + 'px';
  s.style.transform = 'translate(-50%,-50%) rotate(' + rot + 'deg)';

  APP.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  if (E.gl) E.resize(APP.SW, APP.SH, APP.dpr);
};

APP.toStage = function (cx, cy) {
  const dx = cx - window.innerWidth / 2, dy = cy - window.innerHeight / 2;
  let lx, ly;
  if (APP.rot === 0) { lx = dx; ly = dy; }
  else if (APP.rot === -90) { lx = -dy; ly = dx; }
  else { lx = dy; ly = -dx; }
  return { x: lx + APP.SW / 2, y: ly + APP.SH / 2 };
};

APP.localPoint = function (target, cx, cy) {
  const s = APP.toStage(cx, cy);
  let ox = 0, oy = 0, n = target, guard = 0;
  while (n && n !== APP.stage && guard++ < 40) { ox += n.offsetLeft; oy += n.offsetTop; n = n.offsetParent; }
  return { x: s.x - ox, y: s.y - oy };
};

/* ---------- dom refs ---------- */
const $ = id => document.getElementById(id);
let UI = {};

/* ---------- helpers ---------- */
function shuffledDeck() {
  const d = ISSUES.slice().sort(() => Math.random() - 0.5);
  return d;
}
function nextIssue() {
  if (!APP.deck.length) APP.deck = shuffledDeck();
  return APP.deck.pop();
}
function flash(cls, ms) {
  UI.flash.className = 'flash ' + cls;
  setTimeout(() => UI.flash.className = 'flash', ms || 220);
}
function buzz(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

/* ---------- game flow ---------- */
APP.start = function () {
  SFX.init(); SFX.resume(); VOICE.prime();
  APP.state = 'driving';
  APP.progress = 0; APP.condition = 100; APP.speed = 8; APP.targetSpeed = 30;
  APP.issue = null; APP.issuePhase = null; APP.nextIssueIn = 5.5;
  APP.fixed = 0; APP.failed = 0; APP.bumps = 0; APP.ignoredTime = 0;
  APP.flatWheel = -1; APP.damageLook = false; APP.cabinZ = null;
  APP.deck = shuffledDeck(); APP.obstacleIn = 3.2;
  W.mode = 'rover'; W.gray = 0; W.hoodSmoke = 0; W.tilt = 0;
  W.carX = 0; W.carTargetX = 0; W.obstacles.length = 0; W.debris.length = 0; W.smoke.length = 0;
  UI.menu.classList.add('hide');
  UI.end.classList.add('hide');
  UI.alert.classList.add('hide');
  UI.repair.classList.add('hide');
  UI.hud.classList.remove('hide');
  UI.hint.classList.remove('hide');
  setTimeout(() => UI.hint.classList.add('hide'), 5200);
  VOICE.say('Ski trip! Nothing can go wrong.', { pitch: 0.8, rate: 1.1 });
  SFX.ding();
};

APP.triggerIssue = function () {
  const iss = nextIssue();
  APP.issue = iss;
  APP.issuePhase = 'alert';
  APP.state = 'alert';
  const line = CHAD_LINES[(Math.random() * CHAD_LINES.length) | 0];

  if (iss.flat) { APP.flatWheel = (Math.random() * 4) | 0; W.tilt = 0.035; }
  if (iss.smoke) W.hoodSmoke = Math.min(1, W.hoodSmoke + 0.5);
  if (iss.debris !== undefined) { W.spawnDebris(iss.debris); W.spawnDebris(iss.debris); }
  W.camShake = 1.0;

  SFX.alarm();
  if (iss.id === 'flat') SFX.explodeLite();
  else if (iss.id === 'sunroof') SFX.crack();
  else if (iss.id === 'exhaust') SFX.spark();
  else if (iss.id === 'seat') SFX.squeak();
  else if (iss.id === 'battery') SFX.engineDie();
  else SFX.clunk();
  setTimeout(() => VOICE.say(line, { pitch: 0.62 + Math.random() * 0.2, rate: 1.15 + Math.random() * 0.2 }), 180);

  UI.aIcon.textContent = iss.icon;
  UI.aName.textContent = iss.name;
  UI.aSub.textContent = iss.sub;
  UI.aLine.textContent = '“' + line + '”';
  UI.alert.classList.remove('hide');
  UI.alert.classList.add('pop');
  flash('red', 400);
  buzz(80);
};

APP.acknowledge = function () {
  SFX.beep();
  UI.alert.classList.add('hide');
  APP.issuePhase = 'repair';
  APP.state = 'repair';
  UI.repair.classList.remove('hide');
  UI.rTag.textContent = APP.issue.icon + '  ' + APP.issue.name;
  MINI.run(APP.issue.mg, UI.rHost, APP.issue, APP.repairDone);
};

APP.repairDone = function (ok) {
  const iss = APP.issue;
  UI.repair.classList.add('hide');
  UI.rHost.innerHTML = '';
  APP.issue = null; APP.issuePhase = null;
  if (APP.state !== 'breakdown') APP.state = 'driving';

  if (ok) {
    APP.fixed++;
    APP.condition = Math.min(100, APP.condition + 8);
    if (iss.flat) { APP.flatWheel = -1; W.tilt = 0; }
    if (iss.smoke) W.hoodSmoke = Math.max(0, W.hoodSmoke - 0.5);
    SFX.success(); flash('green', 260);
    UI.toast.textContent = '🩹 HELD TOGETHER — for now';
    UI.toast.className = 'toast show good';
    VOICE.say(['Fixed it. Kind of.', 'That will hold. Probably.', 'Do not touch it.', 'We are fine. We are fine!'][(Math.random()*4)|0], { pitch: 0.7, rate: 1.1 });
  } else {
    APP.failed++;
    APP.condition -= 14;
    APP.damageLook = true;
    W.spawnDebris((Math.random()*6)|0);
    SFX.sadTrombone(); flash('red', 400); buzz(140);
    UI.toast.textContent = '💥 THAT MADE IT WORSE';
    UI.toast.className = 'toast show bad';
    VOICE.say(['Not again!', 'Oh God', 'This Range Rover I swear!'][(Math.random()*3)|0], { pitch: 0.6, rate: 1.25 });
  }
  setTimeout(() => UI.toast.className = 'toast', 1800);
  APP.nextIssueIn = 4.0 + Math.random() * 4.5 - APP.progress * 2.0;
};

APP.breakdown = function () {
  APP.state = 'breakdown';
  APP.breakT = 0;
  APP.issue = null; APP.issuePhase = null;
  UI.alert.classList.add('hide');
  UI.repair.classList.add('hide');
  UI.rHost.innerHTML = '';
  SFX.engineDie(); SFX.explodeLite();
  W.camShake = 2.2; W.hoodSmoke = 1;
  for (let i = 0; i < 14; i++) W.spawnDebris((Math.random() * 6) | 0);
  APP.flatWheel = (Math.random() * 4) | 0;
  W.tilt = 0.08;
  W.puff(24, W.carX, 1.6, -2.2, [0.3, 0.3, 0.32]);
  buzz([90, 60, 200]);
  setTimeout(() => VOICE.say('This Range Rover I swear!', { pitch: 0.55, rate: 1.3 }), 500);
  setTimeout(() => VOICE.say('God help me.', { pitch: 0.6, rate: 0.95 }), 2200);
};

APP.toJetta = function () {
  UI.cut.classList.add('hide');
  APP.state = 'jetta';
  W.mode = 'jetta';
  W.gray = 0.45; W.tilt = 0; W.hoodSmoke = 0;
  APP.flatWheel = -1; APP.damageLook = false;
  APP.targetSpeed = 17; APP.speed = 4;
  APP.jettaMutterIn = 3;
  W.debris.length = 0;
  UI.hud.classList.add('jetta');
  UI.hudTitle.textContent = '🚗 JETTA MODE — ADEQUATE';
  SFX.jettaBlinker();
  VOICE.say('It has a warranty. I have nothing.', { pitch: 0.62, rate: 0.95 });
};

APP.finish = function (kind) {
  APP.state = 'end';
  UI.hud.classList.add('hide');
  UI.end.classList.remove('hide');
  const stats = '<div class="stat"><b>' + APP.fixed + '</b><span>repairs improvised</span></div>' +
                '<div class="stat"><b>' + APP.failed + '</b><span>repairs botched</span></div>' +
                '<div class="stat"><b>' + APP.bumps + '</b><span>things hit</span></div>';
  if (kind === 'rover') {
    SFX.fanfare();
    UI.eTitle.textContent = '🏔️ YOU MADE IT';
    UI.eSub.innerHTML = 'Chad pulled into the Ski Trip Cabin in a white Range Rover held together with duct tape, hope, and ' + APP.fixed + ' field repairs.<br><br>He will tell everyone it drives great.';
    UI.eStats.innerHTML = stats;
    UI.end.className = 'screen win';
    VOICE.say('We made it! I told you it was reliable.', { pitch: 0.78, rate: 1.1 });
  } else {
    SFX.sadTrombone();
    UI.eTitle.textContent = '🚗 THE JETTA ENDING';
    UI.eSub.innerHTML = 'Chad reached the cabin. In a Jetta.<br><br>Nothing rattled. Nothing leaked. Nothing needed him. He sat in the parking lot for eleven minutes in a car that simply <i>worked</i>, and he has never felt emptier.';
    UI.eStats.innerHTML = stats;
    UI.end.className = 'screen lose';
    VOICE.say('It is a good car. That is the problem.', { pitch: 0.6, rate: 0.95 });
  }
};

/* ---------- main loop ---------- */
function gameLoop(now) {
  requestAnimationFrame(gameLoop);
  const dt = Math.max(0, Math.min(0.05, (now - APP.last) / 1000)) || 0.016;
  APP.last = now;
  const st = APP.state;

  if (st === 'menu') {
    APP.speed += (16 - APP.speed) * dt;
    W.update(dt, APP.speed, APP);
    W.render(APP);
    return;
  }

  if (st === 'breakdown') {
    APP.breakT += dt;
    APP.speed = Math.max(0, APP.speed - dt * 22);
    W.gray = Math.min(0.55, W.gray + dt * 0.22);
    if (APP.breakT > 2.6 && UI.cut.classList.contains('hide')) {
      UI.cut.classList.remove('hide');
      UI.cutBody.innerHTML =
        '<div class="cut-icon">💀🚙</div>' +
        '<h2>IT IS OVER</h2>' +
        '<p>The Range Rover has stopped. Permanently. Several of its components are now several miles behind you.</p>' +
        '<p class="quote">“I loved it. It never loved me.”</p>' +
        '<p class="small">A man at the dealership offers you a grey Jetta. It has 4 working doors, which is 4 more than you are used to.</p>';
    }
    W.update(dt, APP.speed, APP);
    W.render(APP);
    return;
  }

  if (st === 'end') { W.update(dt, APP.speed * 0.5, APP); W.render(APP); return; }

  /* ---- driving / alert / repair / jetta ---- */
  const jetta = st === 'jetta';
  let target = jetta ? 17 : 30;
  if (APP.issuePhase === 'alert') target = 16;
  else if (APP.issuePhase === 'repair') target = 21;
  target *= 0.55 + 0.45 * Math.max(0.15, APP.condition / 100);
  APP.targetSpeed = target;
  APP.speed += (APP.targetSpeed - APP.speed) * Math.min(1, dt * 1.4);

  APP.progress += APP.speed * dt / (jetta ? 900 : 2200);
  if (APP.progress > 1) APP.progress = 1;

  // unresolved issues eat the car alive
  if (APP.issuePhase) {
    APP.ignoredTime += dt;
    APP.condition -= dt * (APP.issuePhase === 'alert' ? 4.0 : 0.8);
    APP.tint = 0.18 + Math.sin(now / 90) * 0.14;
    if (APP.issuePhase === 'alert' && Math.random() < dt * 1.4) SFX.beep();
  } else {
    APP.tint = Math.max(0, APP.tint - dt * 2);
  }
  if (!jetta) W.hoodSmoke = Math.max(W.hoodSmoke, APP.condition < 45 ? (45 - APP.condition) / 70 : 0);
  if (APP.condition < 55) APP.damageLook = true;

  // new issues
  if (!jetta && !APP.issuePhase) {
    APP.nextIssueIn -= dt;
    if (APP.nextIssueIn <= 0 && APP.progress < 0.96) APP.triggerIssue();
  }

  // obstacles
  APP.obstacleIn -= dt * (APP.issuePhase === 'repair' ? 0.45 : 1);
  if (APP.obstacleIn <= 0) {
    W.spawnObstacle();
    APP.obstacleIn = (jetta ? 3.4 : 2.6) + Math.random() * 2.2;
  }
  for (const o of W.obstacles) {
    if (!o.hit && o.z > -2.6 && o.z < 2.6 && Math.abs(o.x - W.carX) < 1.5) {
      o.hit = true; APP.bumps++;
      APP.condition -= (o.kind === 'moose' ? 8 : o.kind === 'hole' ? 4 : 2.5);
      W.camShake = 1.6; buzz(60);
      if (o.kind === 'moose') { SFX.boing(); VOICE.say('Not again!', { pitch: 0.6, rate: 1.3 }); }
      else if (o.kind === 'snowman') { SFX.explodeLite(); W.puff(10, o.x, 1, 0, [1,1,1]); }
      else SFX.clunk();
      flash('red', 160);
      if (!jetta && Math.random() < 0.5) W.spawnDebris((Math.random()*6)|0);
    }
  }

  // the cabin appears on the horizon
  if (APP.progress >= 0.93) APP.cabinZ = -190 * (1 - APP.progress) / 0.07 + 5;
  else APP.cabinZ = null;

  // outcomes
  if (!jetta && APP.condition <= 0) { APP.condition = 0; return APP.breakdown(); }
  if (APP.progress >= 1) return APP.finish(jetta ? 'jetta' : 'rover');

  // Chad mutters about the Jetta
  if (jetta) {
    APP.jettaMutterIn -= dt;
    if (APP.jettaMutterIn <= 0) {
      APP.jettaMutterIn = 7 + Math.random() * 5;
      VOICE.say(JETTA_MUTTERS[(Math.random() * JETTA_MUTTERS.length) | 0], { pitch: 0.6, rate: 0.96 });
      UI.toast.textContent = '😐 nothing is wrong';
      UI.toast.className = 'toast show mild';
      setTimeout(() => UI.toast.className = 'toast', 2000);
    }
  }

  // HUD
  UI.progFill.style.width = (APP.progress * 100).toFixed(1) + '%';
  UI.progCar.style.left = (APP.progress * 100).toFixed(1) + '%';
  const c = Math.max(0, APP.condition);
  UI.condFill.style.width = c + '%';
  UI.condFill.style.background = c > 60 ? 'linear-gradient(90deg,#3ddc84,#1f9e55)'
                        : c > 30 ? 'linear-gradient(90deg,#ffd166,#e8871a)'
                                 : 'linear-gradient(90deg,#ff7b7b,#d3352c)';
  UI.condNum.textContent = Math.round(c) + '%';
  UI.speedNum.textContent = Math.round(APP.speed * 2.6) + ' mph';

  W.update(dt, APP.speed, APP);
  W.render(APP);
}

/* ---------- input: steering ---------- */
function bindSteering() {
  let dragging = false, lastX = 0;
  const drive = APP.stage;
  drive.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.panel, button, .screen')) return;
    dragging = true; lastX = APP.toStage(e.clientX, e.clientY).x;
  });
  drive.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const x = APP.toStage(e.clientX, e.clientY).x;
    const dx = (x - lastX) / APP.SW;
    lastX = x;
    W.carTargetX = Math.max(-3.6, Math.min(3.6, W.carTargetX + dx * 11));
  });
  const up = () => { dragging = false; };
  drive.addEventListener('pointerup', up);
  drive.addEventListener('pointercancel', up);
}

/* ---------- boot ---------- */
window.addEventListener('load', () => {
  APP.stage = $('stage');
  APP.canvas = $('gl');
  UI = {
    menu: $('menu'), hud: $('hud'), hint: $('hint'), flash: $('flash'), toast: $('toast'),
    alert: $('alert'), aIcon: $('aIcon'), aName: $('aName'), aSub: $('aSub'), aLine: $('aLine'),
    repair: $('repair'), rHost: $('rHost'), rTag: $('rTag'),
    cut: $('cut'), cutBody: $('cutBody'),
    end: $('end'), eTitle: $('eTitle'), eSub: $('eSub'), eStats: $('eStats'),
    progFill: $('progFill'), progCar: $('progCar'), condFill: $('condFill'),
    condNum: $('condNum'), speedNum: $('speedNum'), hudTitle: $('hudTitle')
  };

  try { E.init(APP.canvas); } catch (err) {
    document.body.innerHTML = '<div style="color:#fff;font:16px system-ui;padding:40px">This game needs WebGL. Try Safari or Chrome.</div>';
    return;
  }
  APP.layout();
  W.build();
  bindSteering();

  window.addEventListener('resize', APP.layout);
  window.addEventListener('orientationchange', () => setTimeout(APP.layout, 120));
  if (window.screen && screen.orientation) screen.orientation.addEventListener('change', () => setTimeout(APP.layout, 120));

  $('startBtn').addEventListener('click', () => APP.start());
  $('ackBtn').addEventListener('click', () => APP.acknowledge());
  $('sellBtn').addEventListener('click', () => APP.toJetta());
  $('againBtn').addEventListener('click', () => { UI.hud.classList.remove('jetta'); UI.hudTitle.textContent = '🏔️ TO THE SKI CABIN'; APP.start(); });
  $('muteBtn').addEventListener('click', () => {
    APP.muted = !APP.muted; SFX.muted = APP.muted; VOICE.muted = APP.muted;
    if (APP.muted && window.speechSynthesis) speechSynthesis.cancel();
    $('muteBtn').textContent = APP.muted ? '🔇' : '🔊';
  });

  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

  APP.last = performance.now();
  requestAnimationFrame(gameLoop);

  if (navigator.serviceWorker && navigator.serviceWorker.register) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
