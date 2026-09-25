/* ============================================================
   WORLD — meshes, scenery, the Range Rover, Chad, and the Jetta
   ============================================================ */
'use strict';

const W = {
  meshes: {},
  trees: [], dashes: [], rocks: [], obstacles: [], banks: [], mountains: [],
  camShake: 0, gray: 0, tilt: 0, bob: 0, t: 0,
  carX: 0, carTargetX: 0, wheelSpin: 0, mode: 'rover', // 'rover' | 'jetta'
  hoodSmoke: 0, debris: [],
  snowP: null, snowC: null, snowN: 260,
  smokeP: null, smokeC: null, smoke: [], smokeMax: 90
};

const COL = {
  white: 0xf4f6f8, whiteDark: 0xd9dee4, glass: 0x1d2630, tyre: 0x14171b,
  rim: 0xb9c0c8, road: 0x3a3d44, roadLine: 0xe8e2c8, snow: 0xf2f7fd,
  snowShade: 0xd7e4f2, pine: 0x1f5137, pineDark: 0x163b28, trunk: 0x4a3526,
  rock: 0x6c7280, red: 0xd3352c, amber: 0xf0a12a, chrome: 0xc8ced6,
  skin: 0xf2c49b, hair: 0xc9591f, jacket: 0x2f5d4a, jetta: 0x8e959d,
  jettaDark: 0x6d757d, cone: 0xf0630f, moose: 0x5a3c26
};

/* ---------- build every mesh once ---------- */
W.build = function () {
  const M = W.meshes;

  /* ---- the Range Rover (faces -Z, camera sits behind at +Z) ---- */
  function roverBody(b, bodyCol, dirty) {
    const bc = dirty ? 0xd8d2c6 : bodyCol;
    b.box(0, 0.62, 0, 2.26, 0.42, 4.76, 0x2a2e33);            // sill / cladding
    b.box(0, 1.02, 0, 2.20, 0.66, 4.80, bc);                   // main body
    b.box(0, 1.34, 0.30, 2.14, 0.30, 4.10, bc, 1.02);          // shoulder
    b.box(0, 1.30, -2.30, 2.10, 0.42, 0.24, COL.chrome);       // front bumper trim
    b.box(0, 0.95, -2.44, 2.04, 0.46, 0.18, 0x23262b);         // front bumper
    b.box(0, 0.95,  2.44, 2.04, 0.46, 0.18, 0x23262b);         // rear bumper
    b.box(0, 1.30,  2.36, 1.96, 0.46, 0.14, bc);               // tailgate
    // ---- interior, visible straight through the open rear window ----
    const hide = dirty ? 0x6d5e4c : 0x9a8873;                  // "immaculate" tan leather
    b.box(0, 1.53, 0.25, 1.90, 0.06, 3.30, 0x2f353d);          // cabin floor (sits above the bodywork)
    b.box(0, 1.64, -1.26, 1.90, 0.26, 0.22, 0x262b32);         // dashboard
    b.box(-0.42, 1.58, 0.98, 0.50, 0.32, 0.13, hide);          // driver seat back
    b.box( 0.52, 1.58, 0.98, 0.50, 0.32, 0.13, hide);          // passenger seat back
    b.box( 0.52, 1.80, 0.98, 0.30, 0.20, 0.12, hide, 0.88);    // passenger headrest
    if (dirty) { b.box(0.52, 1.61, 0.90, 0.32, 0.17, 0.06, 0x3a3f47); }  // the tear
    // ---- floating roof on 6 pillars, rear window left open so Chad reads clearly ----
    b.box(0, 2.22, 0.10, 2.02, 0.10, 3.00, 0x22262c);          // roof
    b.box(0, 2.24, 0.55, 1.02, 0.06, 1.20, 0x0f1418);          // sunroof glass
    b.box(0, 1.53, 1.56, 1.92, 0.09, 0.12, bc);                // rear window sill
    b.box(0, 1.86, -1.40, 1.88, 0.62, 0.06, COL.glass);        // windshield
    b.box(0, 2.08, -1.20, 0.34, 0.10, 0.10, 0x2a2f36);         // rear-view mirror
    b.box(-0.93, 1.85,  1.52, 0.16, 0.64, 0.18, bc);           // C pillars
    b.box( 0.93, 1.85,  1.52, 0.16, 0.64, 0.18, bc);
    b.box(-0.93, 1.85, -1.30, 0.13, 0.64, 0.16, bc);           // A pillars
    b.box( 0.93, 1.85, -1.30, 0.13, 0.64, 0.16, bc);
    b.box(-0.93, 1.85,  0.18, 0.11, 0.64, 0.14, 0x1b1f24);     // B pillars
    b.box( 0.93, 1.85,  0.18, 0.11, 0.64, 0.14, 0x1b1f24);
    b.box(-0.955, 1.84, 0.12, 0.05, 0.58, 2.62, COL.glass);    // tinted side glass
    b.box( 0.955, 1.84, 0.12, 0.05, 0.58, 2.62, COL.glass);
    b.box(-0.80, 2.32, 0.10, 0.10, 0.09, 2.60, 0x14181d);      // roof rails
    b.box( 0.80, 2.32, 0.10, 0.10, 0.09, 2.60, 0x14181d);
    // lights
    b.box(-0.78, 1.28, 2.46, 0.52, 0.20, 0.06, COL.red);
    b.box( 0.78, 1.28, 2.46, 0.52, 0.20, 0.06, COL.red);
    b.box(-0.80, 1.24, -2.50, 0.46, 0.18, 0.05, 0xfff3cf);
    b.box( 0.80, 1.24, -2.50, 0.46, 0.18, 0.05, 0xfff3cf);
    b.box(0, 1.20, -2.50, 1.10, 0.26, 0.05, 0x1b1f24);         // grille
    // mirrors
    b.box(-1.18, 1.62, -0.90, 0.24, 0.14, 0.16, bc);
    b.box( 1.18, 1.62, -0.90, 0.24, 0.14, 0.16, bc);
    // wheel arch flares
    b.box(-1.09, 0.82, -1.56, 0.10, 0.30, 1.18, 0x2a2e33);
    b.box( 1.09, 0.82, -1.56, 0.10, 0.30, 1.18, 0x2a2e33);
    b.box(-1.09, 0.82,  1.60, 0.10, 0.30, 1.18, 0x2a2e33);
    b.box( 1.09, 0.82,  1.60, 0.10, 0.30, 1.18, 0x2a2e33);
    // wipers
    b.box(-0.40, 1.52, -1.70, 0.62, 0.04, 0.05, 0x101317);
    b.box( 0.40, 1.52, -1.70, 0.62, 0.04, 0.05, 0x101317);
  }
  function chad(b) {
    // 6'2" of ginger optimism, seated
    b.box(-0.42, 1.46, 0.58, 0.52, 0.58, 0.32, COL.jacket);     // torso
    b.sphere(-0.42, 1.90, 0.60, 0.205, 9, COL.skin);            // head
    b.sphere(-0.42, 1.955, 0.635, 0.208, 9, COL.hair);          // ginger mop
    b.sphere(-0.42, 1.815, 0.425, 0.145, 8, COL.hair);          // small beard
    b.sphere(-0.485, 1.925, 0.405, 0.032, 6, 0x24313f);         // eyes
    b.sphere(-0.355, 1.925, 0.405, 0.032, 6, 0x24313f);
    b.box(-0.665, 1.52, 0.18, 0.12, 0.12, 0.62, COL.jacket);    // arms out to the wheel
    b.box(-0.175, 1.52, 0.18, 0.12, 0.12, 0.62, COL.jacket);
    b.cyl(-0.42, 1.50, -0.16, 0.21, 0.06, 12, 0x1a1e23, 2);     // steering wheel
  }
  let b = new Builder(); roverBody(b, COL.white); chad(b); M.rover = new Mesh(b);
  b = new Builder(); roverBody(b, COL.white, true); chad(b); M.roverBeat = new Mesh(b);

  /* ---- the Jetta: adequate ---- */
  b = new Builder();
  b.box(0, 0.62, 0, 1.78, 0.46, 4.22, COL.jettaDark);
  b.box(0, 0.94, 0, 1.74, 0.42, 4.30, COL.jetta);
  b.box(0, 1.34, 0.42, 1.44, 0.44, 1.90, COL.jetta);
  b.box(0, 1.52, 0.42, 1.40, 0.10, 1.86, COL.jettaDark);
  b.box(0, 1.32, 1.38, 1.30, 0.42, 0.06, COL.glass);
  b.box(-0.60, 1.06, 2.14, 0.40, 0.16, 0.05, 0xb8433c);
  b.box( 0.60, 1.06, 2.14, 0.40, 0.16, 0.05, 0xb8433c);
  b.box(0, 1.02, -2.16, 0.90, 0.18, 0.05, 0x2a2e33);
  b.sphere(-0.34, 1.44, 0.96, 0.19, 9, COL.skin);
  b.sphere(-0.34, 1.50, 1.00, 0.195, 9, COL.hair);
  b.sphere(-0.34, 1.35, 0.78, 0.14, 8, COL.hair);
  b.box(-0.34, 1.10, 0.96, 0.46, 0.44, 0.30, COL.jacket);
  M.jetta = new Mesh(b);

  /* ---- wheels ---- */
  b = new Builder();
  b.cyl(0, 0, 0, 0.47, 0.34, 14, COL.tyre, 0);
  b.cyl(0.005, 0, 0, 0.27, 0.36, 10, COL.rim, 0);
  for (let i=0;i<5;i++){ const a=(i/5)*Math.PI*2;
    b.box(0.19, Math.cos(a)*0.16, Math.sin(a)*0.16, 0.05, 0.10, 0.10, 0x8b9199); }
  M.wheel = new Mesh(b);
  b = new Builder(); b.cyl(0, 0, 0, 0.27, 0.30, 10, 0x9aa1a9, 0); M.wheelFlatRim = new Mesh(b);
  b = new Builder();
  b.cyl(0, -0.08, 0, 0.44, 0.44, 14, COL.tyre, 0);   // squashed + wide = flat
  M.wheelFlat = new Mesh(b);
  b = new Builder(); b.cyl(0,0,0, 0.33, 0.22, 12, COL.tyre, 0); b.cyl(0.004,0,0,0.18,0.24,8,0x9aa1a9,0);
  M.wheelSm = new Mesh(b);

  /* ---- road & ground ---- */
  b = new Builder();
  b.box(0, -0.02, -180, 9.4, 0.12, 430, COL.road);
  b.box(-4.78, 0.06, -180, 0.34, 0.20, 430, 0xe9edf2);
  b.box( 4.78, 0.06, -180, 0.34, 0.20, 430, 0xe9edf2);
  M.road = new Mesh(b);
  b = new Builder(); b.box(0, -0.16, -180, 240, 0.20, 440, COL.snow); M.ground = new Mesh(b);
  b = new Builder(); b.box(0, 0.07, 0, 0.26, 0.06, 3.4, COL.roadLine); M.dash = new Mesh(b);

  /* ---- scenery ---- */
  b = new Builder();
  b.cyl(0, 0.5, 0, 0.17, 1.0, 7, COL.trunk);
  b.cone(0, 0.8, 0, 1.25, 2.1, 9, COL.pine);
  b.cone(0, 2.1, 0, 0.98, 1.9, 9, COL.pineDark);
  b.cone(0, 3.3, 0, 0.70, 1.6, 9, COL.pine);
  b.cone(0, 4.5, 0, 0.42, 0.9, 8, COL.snow);
  M.tree = new Mesh(b);

  b = new Builder();
  b.box(0, 0.35, 0, 3.0, 0.70, 5.0, COL.snowShade);
  b.box(0, 0.62, 0, 2.6, 0.30, 4.6, COL.snow);
  M.bank = new Mesh(b);

  b = new Builder(); b.sphere(0, 0.5, 0, 0.7, 7, COL.rock); b.sphere(0.2, 0.95, 0.1, 0.5, 7, COL.snow);
  M.rock = new Mesh(b);

  b = new Builder();
  b.cone(0, 0, 0, 22, 30, 9, COL.snowShade);
  b.cone(0, 20, 0, 8, 12, 9, COL.snow);
  M.mountain = new Mesh(b);

  b = new Builder();
  b.box(0, 1.6, 0, 6.4, 3.2, 5.2, 0x6b4a31);
  b.cone(0, 3.2, 0, 5.2, 2.4, 4, 0xf2f7fd);
  b.box(0, 1.0, -2.7, 1.2, 2.0, 0.2, 0x3c2a1c);
  b.box(-1.8, 1.9, -2.7, 1.0, 0.9, 0.2, 0xffd98a);
  b.box( 1.8, 1.9, -2.7, 1.0, 0.9, 0.2, 0xffd98a);
  b.cyl(2.2, 3.6, 1.0, 0.35, 1.6, 8, 0x8a8f97);
  M.cabin = new Mesh(b);

  /* ---- obstacles ---- */
  b = new Builder(); b.cone(0, 0, 0, 0.32, 0.72, 8, COL.cone); b.box(0, 0.04, 0, 0.72, 0.08, 0.72, 0x21252a);
  M.obsCone = new Mesh(b);
  b = new Builder(); b.box(0, 0.06, 0, 1.7, 0.10, 1.7, 0x16191d); b.box(0, 0.02, 0, 2.0, 0.06, 2.0, 0x2b2f35);
  M.obsHole = new Mesh(b);
  b = new Builder();
  b.sphere(0, 0.5, 0, 0.55, 8, COL.snow); b.sphere(0, 1.15, 0, 0.38, 8, COL.snow);
  b.sphere(0, 1.62, 0, 0.27, 8, COL.snow); b.cone(0, 1.58, -0.26, 0.07, 0.34, 6, COL.cone);
  b.box(0, 1.86, 0, 0.5, 0.06, 0.5, 0x22262c); b.box(0, 2.0, 0, 0.3, 0.26, 0.3, 0x22262c);
  M.obsSnowman = new Mesh(b);
  b = new Builder();
  b.box(0, 1.5, 0, 0.9, 0.9, 2.0, COL.moose);
  b.box(0, 1.9, -1.1, 0.5, 0.5, 0.7, COL.moose);
  b.box(-0.5, 2.35, -1.2, 0.7, 0.1, 0.5, 0x8a6a4a);
  b.box( 0.5, 2.35, -1.2, 0.7, 0.1, 0.5, 0x8a6a4a);
  for (const [x,z] of [[-0.32,-0.7],[0.32,-0.7],[-0.32,0.7],[0.32,0.7]])
    b.box(x, 0.55, z, 0.18, 1.1, 0.18, 0x3f2b1b);
  M.obsMoose = new Mesh(b);

  /* ---- flying debris (parts departing the vehicle) ---- */
  b = new Builder(); b.box(0,0,0, 0.9, 0.06, 0.08, 0x101317); M.partWiper = new Mesh(b);
  b = new Builder(); b.cyl(0,0,0, 0.3, 0.06, 10, COL.chrome, 1); M.partHub = new Mesh(b);
  b = new Builder(); b.box(0,0,0, 1.0, 1.2, 0.08, COL.white); M.partDoor = new Mesh(b);
  b = new Builder(); b.box(0,0,0, 0.28, 0.16, 0.2, COL.white); M.partMirror = new Mesh(b);
  b = new Builder(); b.cyl(0,0,0, 0.09, 0.9, 8, 0x4a4f56, 2); M.partPipe = new Mesh(b);
  b = new Builder(); b.box(0,0,0, 0.5, 0.06, 0.5, 0x2b3038); M.partPanel = new Mesh(b);
  W.debrisMeshes = [M.partWiper, M.partHub, M.partDoor, M.partMirror, M.partPipe, M.partPanel];

  /* ---- populate the world ---- */
  for (let i=0;i<64;i++)
    W.trees.push({ x: (Math.random()<0.5?-1:1)*(6.5+Math.random()*16), z: -(i*6.6)-Math.random()*4,
                   s: 0, ry: Math.random()*6 });
  for (let i=0;i<40;i++) W.dashes.push({ z: -i*9 });
  for (let i=0;i<22;i++)
    W.rocks.push({ x:(Math.random()<0.5?-1:1)*(5.6+Math.random()*4), z:-(i*18)-Math.random()*12, ry:Math.random()*6 });
  for (let i=0;i<34;i++)
    W.banks.push({ x:(i%2?1:-1)*6.0, z:-(i*12)-Math.random()*6 });
  for (let i=0;i<9;i++)
    W.mountains.push({ x:(Math.random()<0.5?-1:1)*(40+Math.random()*60), z:-140-Math.random()*160, s:0 });

  W.snowP = new Float32Array(W.snowN*3);
  W.snowC = new Float32Array(W.snowN*4);
  for (let i=0;i<W.snowN;i++){
    W.snowP[i*3]= (Math.random()-0.5)*44;
    W.snowP[i*3+1]= Math.random()*16;
    W.snowP[i*3+2]= -Math.random()*70 + 8;
    const a = 0.45+Math.random()*0.55;
    W.snowC[i*4]=1; W.snowC[i*4+1]=1; W.snowC[i*4+2]=1; W.snowC[i*4+3]=a;
  }
  W.smokeP = new Float32Array(W.smokeMax*3);
  W.smokeC = new Float32Array(W.smokeMax*4);
};

/* ---------- debris / particles ---------- */
W.spawnDebris = function (kind) {
  const m = W.debrisMeshes[kind % W.debrisMeshes.length];
  W.debris.push({
    m, x: W.carX + (Math.random()-0.5)*2, y: 1.2 + Math.random()*0.6, z: -0.5,
    vx: (Math.random()-0.5)*7, vy: 5 + Math.random()*4, vz: 7 + Math.random()*6,
    rx: Math.random()*9, ry: Math.random()*9, rz: Math.random()*9,
    sx: (Math.random()-0.5)*14, sy: (Math.random()-0.5)*14, sz: (Math.random()-0.5)*14,
    life: 2.6
  });
};

W.puff = function (n, x, y, z, col) {
  for (let i=0;i<n;i++){
    if (W.smoke.length >= W.smokeMax) W.smoke.shift();
    W.smoke.push({ x: x + (Math.random()-0.5)*0.5, y, z: z + (Math.random()-0.5)*0.5,
      vx:(Math.random()-0.5)*1.2, vy: 1.2+Math.random()*1.6, vz: 2.2+Math.random()*2,
      life: 1.2+Math.random()*0.8, max: 2, c: col || [0.55,0.57,0.6] });
  }
};

/* ---------- per-frame update ---------- */
W.update = function (dt, speed, state) {
  W.t += dt;
  const move = speed * dt;

  const recycle = (arr, span, fn) => {
    for (const o of arr) { o.z += move; if (o.z > 16) { o.z -= span; if (fn) fn(o); } }
  };
  recycle(W.trees, 64*6.6, o => { o.x = (Math.random()<0.5?-1:1)*(6.5+Math.random()*16); o.ry = Math.random()*6; });
  recycle(W.dashes, 40*9);
  recycle(W.rocks, 22*18, o => { o.x = (Math.random()<0.5?-1:1)*(5.6+Math.random()*4); });
  recycle(W.banks, 34*12);
  for (const m of W.mountains) { m.z += move * 0.06; if (m.z > 60) m.z -= 300; }

  // steering easing
  W.carX += (W.carTargetX - W.carX) * Math.min(1, dt * 7);
  W.wheelSpin += speed * dt * 1.6;
  W.bob = Math.sin(W.t * 9) * 0.02 + Math.sin(W.t * 3.3) * 0.015;
  W.camShake = Math.max(0, W.camShake - dt * 2.4);

  // obstacles
  for (let i = W.obstacles.length - 1; i >= 0; i--) {
    const o = W.obstacles[i];
    o.z += move;
    if (o.z > 14) W.obstacles.splice(i, 1);
  }

  // debris physics
  for (let i = W.debris.length - 1; i >= 0; i--) {
    const d = W.debris[i];
    d.vy -= 16 * dt;
    d.x += d.vx*dt; d.y += d.vy*dt; d.z += (d.vz + speed*0.4)*dt;
    d.rx += d.sx*dt; d.ry += d.sy*dt; d.rz += d.sz*dt;
    d.life -= dt;
    if (d.life <= 0 || d.y < -3) W.debris.splice(i,1);
  }

  // snow
  for (let i=0;i<W.snowN;i++){
    W.snowP[i*3+1] -= (3.2 + (i%5)) * dt;
    W.snowP[i*3]   += Math.sin(W.t*1.4 + i)*0.9*dt;
    W.snowP[i*3+2] += move * 0.85;
    if (W.snowP[i*3+1] < -1 || W.snowP[i*3+2] > 12) {
      W.snowP[i*3]   = W.carX + (Math.random()-0.5)*44;
      W.snowP[i*3+1] = 12 + Math.random()*6;
      W.snowP[i*3+2] = -60 - Math.random()*20;
    }
  }

  // smoke from a suffering engine
  if (W.hoodSmoke > 0 && Math.random() < W.hoodSmoke * dt * 22)
    W.puff(1, W.carX + (Math.random()-0.5)*1.2, 1.5, -2.2, [0.42,0.44,0.48]);
  for (let i = W.smoke.length - 1; i >= 0; i--) {
    const s = W.smoke[i];
    s.x += s.vx*dt; s.y += s.vy*dt; s.z += (s.vz + speed*0.25)*dt;
    s.life -= dt;
    if (s.life <= 0) W.smoke.splice(i,1);
  }
};

W.spawnObstacle = function () {
  const kinds = ['cone','hole','snowman','moose'];
  const k = kinds[(Math.random()*kinds.length)|0];
  W.obstacles.push({ kind: k, x: -3.4 + Math.random()*6.8, z: -150, hit: false, ry: Math.random()*6 });
};

/* ---------- render ---------- */
W.render = function (state) {
  const shake = W.camShake;
  const sx = (Math.random()-0.5) * shake * 0.6;
  const sy = (Math.random()-0.5) * shake * 0.5;
  const camX = W.carX * 0.42 + sx;
  const camY = 3.85 + W.bob * 2 + sy;
  m4lookAt(E.view, camX, camY, 8.4, W.carX * 0.62, 1.30, -10, 0, 1, 0);

  const dusk = state && state.mode === 'jetta';
  const skyTop = dusk ? [0.30,0.33,0.42] : [0.28,0.55,0.86];
  const skyBot = dusk ? [0.62,0.60,0.62] : [0.80,0.90,0.99];
  E.fogColor = dusk ? [0.62,0.62,0.66] : [0.76,0.87,0.97];
  E.beginFrame(skyTop, skyBot, W.gray);

  const M = W.meshes;
  const NEAR = 18, FAR = -230;          // everything past FAR is solid fog anyway
  const vis = o => o.z < NEAR && o.z > FAR;
  E.draw(M.ground, 0, 0, 0, 0,0,0, 0);
  E.draw(M.road, 0, 0, 0, 0,0,0, 0);
  for (const d of W.dashes) if (vis(d)) E.draw(M.dash, 0, 0, d.z);
  for (const b of W.banks) if (vis(b)) E.draw(M.bank, b.x, 0, b.z);
  for (const m of W.mountains) E.draw(M.mountain, m.x, 0, m.z);
  for (const t of W.trees) if (vis(t)) E.draw(M.tree, t.x, 0, t.z, 0, t.ry, 0);
  for (const r of W.rocks) if (vis(r)) E.draw(M.rock, r.x, 0, r.z, 0, r.ry, 0);

  for (const o of W.obstacles) {
    if (o.kind === 'cone') E.draw(M.obsCone, o.x, 0, o.z);
    else if (o.kind === 'hole') E.draw(M.obsHole, o.x, 0, o.z);
    else if (o.kind === 'snowman') E.draw(M.obsSnowman, o.x, 0, o.z, 0, o.ry, 0);
    else E.draw(M.obsMoose, o.x, 0, o.z, 0, o.ry * 0.05, 0);
  }

  if (state && state.cabinZ !== null && state.cabinZ !== undefined && state.cabinZ < 20)
    E.draw(M.cabin, 11, 0, state.cabinZ);

  const tilt = W.tilt;
  const y = W.bob;
  const tint = state ? state.tint : 0;

  if (W.mode === 'jetta') {
    E.draw(M.jetta, W.carX, y, 0, 0, 0, tilt, tint);
    const wz = [[-0.86,-1.42],[0.86,-1.42],[-0.86,1.42],[0.86,1.42]];
    for (const [wx,wzz] of wz)
      E.draw(M.wheelSm, W.carX + wx, 0.33 + y, wzz, W.wheelSpin, 0, 0, tint);
  } else {
    const beat = state && state.damageLook ? M.roverBeat : M.rover;
    E.draw(beat, W.carX, y, 0, 0, 0, tilt, tint);
    const flat = state ? state.flatWheel : -1;
    const wz = [[-1.10,-1.56],[1.10,-1.56],[-1.10,1.60],[1.10,1.60]];
    for (let i=0;i<4;i++){
      const [wx,wzz] = wz[i];
      if (i === flat) {
        E.draw(M.wheelFlat, W.carX + wx, 0.30 + y, wzz, W.wheelSpin*0.4, 0, 0, tint);
      } else {
        E.draw(M.wheel, W.carX + wx, 0.47 + y, wzz, W.wheelSpin, 0, 0, tint);
      }
    }
  }

  for (const d of W.debris) E.draw(d.m, d.x, d.y, d.z, d.rx, d.ry, d.rz, 0);

  // particles
  E.drawPoints(W.snowP, W.snowC, W.snowN, 1.0);
  const n = W.smoke.length;
  if (n) {
    for (let i=0;i<n;i++){
      const s = W.smoke[i];
      W.smokeP[i*3]=s.x; W.smokeP[i*3+1]=s.y; W.smokeP[i*3+2]=s.z;
      const a = Math.max(0, s.life / s.max);
      W.smokeC[i*4]=s.c[0]; W.smokeC[i*4+1]=s.c[1]; W.smokeC[i*4+2]=s.c[2]; W.smokeC[i*4+3]=a*0.9;
    }
    E.drawPoints(W.smokeP.subarray(0,n*3), W.smokeC.subarray(0,n*4), n, 5.0);
  }
};
