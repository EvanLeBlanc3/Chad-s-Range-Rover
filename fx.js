/* ============================================================
   FX — synthesized sound effects + Chad's voice
   ============================================================ */
'use strict';

const SFX = {
  ctx: null, master: null, enabled: true, muted: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  get t() { return this.ctx.currentTime; },

  _osc(type, f0, f1, dur, vol, delay, destination) {
    if (!this.enabled || this.muted || !this.ctx) return;
    const t = this.t + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(destination || this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },

  _noise(dur, vol, type, freq, q, delay) {
    if (!this.enabled || this.muted || !this.ctx) return;
    const t = this.t + (delay || 0);
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<n;i++) d[i] = (Math.random()*2-1) * (1 - i/n);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type || 'bandpass'; f.frequency.value = freq || 900; f.Q.value = q || 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.02);
  },

  /* ---- the sounds of a luxury vehicle in decline ---- */
  beep()      { this._osc('square', 880, 880, 0.09, 0.22); },
  alarm()     { for (let i=0;i<3;i++) this._osc('square', 1046, 784, 0.13, 0.26, i*0.17); },
  ding()      { this._osc('sine', 1318, 1318, 0.35, 0.28); this._osc('sine', 1975, 1975, 0.35, 0.16, 0.03); },
  pop()       { this._osc('sine', 420, 900, 0.09, 0.3); },
  tick()      { this._osc('square', 1400, 1100, 0.035, 0.12); },
  boing()     { this._osc('triangle', 520, 90, 0.42, 0.32); this._osc('triangle', 260, 60, 0.42, 0.18, 0.02); },
  clunk()     { this._osc('triangle', 150, 48, 0.24, 0.42); this._noise(0.16, 0.45, 'lowpass', 400, 1); },
  bonk()      { this._osc('square', 220, 60, 0.3, 0.38); this._noise(0.2, 0.4, 'lowpass', 600, 1); },
  hiss()      { this._noise(0.9, 0.3, 'highpass', 2600, 0.8); },
  squeak()    { this._osc('sawtooth', 1500, 2400, 0.1, 0.1); this._osc('sawtooth', 2200, 1200, 0.12, 0.09, 0.09); },
  ratchet()   { for (let i=0;i<6;i++) this._noise(0.04, 0.3, 'bandpass', 2200 + i*180, 6, i*0.045); },
  glug()      { for (let i=0;i<4;i++) this._osc('sine', 180 + i*30, 90, 0.16, 0.26, i*0.14); },
  wiper()     { this._osc('sawtooth', 300, 900, 0.22, 0.1); this._noise(0.25, 0.12, 'bandpass', 1400, 3); },
  spark()     { for (let i=0;i<5;i++) this._noise(0.05, 0.28, 'highpass', 3000, 1, i*0.05); },
  crack()     { this._noise(0.35, 0.5, 'highpass', 3400, 0.7); this._osc('square', 2600, 400, 0.14, 0.14); },
  error()     { this._osc('square', 200, 120, 0.3, 0.3); this._osc('square', 160, 90, 0.34, 0.24, 0.1); },
  success()   { [523,659,784,1046].forEach((f,i)=>this._osc('triangle', f, f, 0.2, 0.22, i*0.075)); },
  fanfare()   { [523,659,784,1046,1318].forEach((f,i)=>this._osc('square', f, f, 0.34, 0.18, i*0.13));
                [261,329,392,523,659].forEach((f,i)=>this._osc('triangle', f, f, 0.4, 0.14, i*0.13)); },
  sadTrombone(){ const s=[392,370,349,311];
                 s.forEach((f,i)=>this._osc('sawtooth', f, f*0.94, i===3?0.9:0.3, 0.2, i*0.3)); },
  engineDie() { this._osc('sawtooth', 120, 20, 1.6, 0.3); this._noise(1.4, 0.3, 'lowpass', 300, 1);
                this._osc('square', 90, 18, 1.8, 0.16, 0.1); },
  explodeLite(){ this._noise(0.7, 0.55, 'lowpass', 900, 0.8); this._osc('triangle', 180, 30, 0.6, 0.4); },
  jettaBlinker(){ this._osc('square', 900, 900, 0.05, 0.12); this._osc('square', 700, 700, 0.05, 0.1, 0.35); }
};

/* ---- Chad speaks ---- */
const VOICE = {
  voice: null, ready: false, muted: false,
  pick() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    const want = ['Daniel','Alex','Aaron','Fred','Arthur','Rishi','Google UK English Male','Nathan','Tom'];
    for (const n of want) { const v = vs.find(v => v.name.indexOf(n) >= 0); if (v) { this.voice = v; this.ready = true; return; } }
    this.voice = vs.find(v => /en[-_]/i.test(v.lang)) || vs[0];
    this.ready = true;
  },
  prime() {
    if (!window.speechSynthesis) return;
    this.pick();
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  },
  say(text, opts) {
    if (!window.speechSynthesis || this.muted) return;
    opts = opts || {};
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (!this.voice) this.pick();
      if (this.voice) u.voice = this.voice;
      u.pitch = opts.pitch !== undefined ? opts.pitch : 0.72;
      u.rate  = opts.rate  !== undefined ? opts.rate  : 1.12;
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
};
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => VOICE.pick();
