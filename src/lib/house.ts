/**
 * A small original house loop, synthesised live with the Web Audio API (no samples, no files).
 * 122 BPM, four on the floor: kick, off-beat open hat, clap on 2 and 4, a bouncing bass and
 * syncopated chord stabs over Am7 - Am7 - Fmaj7 - G6, with a little echo. The stabs duck on every kick
 * (side-chain style). Every kick also fires a `site:kick` event on window so the visuals can move with it.
 */
export type House = { start: () => Promise<void>; stop: () => void; readonly playing: boolean };

const BPM = 122;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const AHEAD = 0.12; // how far ahead notes are scheduled
const CHORDS = [
  [220.0, 261.63, 329.63, 392.0], // Am7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];
const BASS = [55.0, 55.0, 43.65, 49.0];
const STABS = new Set([3, 6, 10, 13]);

export function createHouse(): House {
  let ctx: AudioContext | null = null;
  let master: GainNode;
  let pump: GainNode;
  let noise: AudioBuffer;
  let timer = 0;
  let step = 0;
  let next = 0;
  let playing = false;

  const build = () => {
    ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp).connect(ctx.destination);

    // chords and echo go through `pump`, which ducks on every kick
    pump = ctx.createGain();
    const echo = ctx.createDelay(1);
    echo.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    pump.connect(master);
    pump.connect(echo);
    echo.connect(fb).connect(echo);
    echo.connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };

  const kick = (t: number) => {
    const c = ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.13);
    g.gain.setValueAtTime(0.95, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.45);
    // duck the chords
    pump.gain.cancelScheduledValues(t);
    pump.gain.setValueAtTime(0.22, t);
    pump.gain.linearRampToValueAtTime(1, t + 0.26);
    window.setTimeout(() => window.dispatchEvent(new Event('site:kick')), Math.max(0, (t - c.currentTime) * 1000));
  };

  const burst = (t: number, type: BiquadFilterType, freq: number, q: number, peak: number, len: number) => {
    const c = ctx!;
    const s = c.createBufferSource();
    s.buffer = noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f).connect(g).connect(master);
    s.start(t, Math.random() * 0.5);
    s.stop(t + len + 0.02);
  };

  const bass = (t: number, freq: number) => {
    const c = ctx!;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(520, t);
    f.frequency.exponentialRampToValueAtTime(140, t + 0.2);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(f).connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.26);
  };

  const stab = (t: number, notes: number[], open: number) => {
    const c = ctx!;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(open, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.22);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    f.connect(g).connect(pump);
    for (const n of notes) {
      for (const det of [-6, 6]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = n;
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + 0.32);
      }
    }
  };

  const schedule = (s: number, t: number) => {
    const inBar = s % 16;
    const bar = Math.floor(s / 16) % 4;
    if (inBar % 4 === 0) kick(t);
    if (inBar === 4 || inBar === 12) {
      burst(t, 'bandpass', 1600, 0.9, 0.5, 0.2);
      burst(t + 0.012, 'bandpass', 2400, 0.9, 0.3, 0.12);
    }
    if (inBar % 4 === 2) burst(t, 'highpass', 7500, 0.7, 0.28, 0.12); // off-beat open hat
    else if (inBar % 2 === 0) burst(t, 'highpass', 9000, 0.7, 0.07, 0.03);
    if (inBar % 4 === 2) bass(t, BASS[bar]);
    if (STABS.has(inBar)) stab(t, CHORDS[bar], 900 + 800 * (0.5 + 0.5 * Math.sin(s * 0.09)));
  };

  const tick = () => {
    const c = ctx!;
    while (next < c.currentTime + AHEAD) {
      schedule(step, next);
      step += 1;
      next += STEP;
    }
  };

  const onVisibility = () => {
    if (!ctx || !playing) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  };

  return {
    get playing() {
      return playing;
    },
    async start() {
      if (playing) return;
      if (!ctx) build();
      const c = ctx!;
      await c.resume();
      playing = true;
      step = 0;
      next = c.currentTime + 0.08;
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setValueAtTime(master.gain.value, c.currentTime);
      master.gain.linearRampToValueAtTime(0.55, c.currentTime + 1.2);
      timer = window.setInterval(tick, 25);
      document.addEventListener('visibilitychange', onVisibility);
    },
    stop() {
      if (!ctx || !playing) return;
      playing = false;
      const c = ctx;
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setValueAtTime(master.gain.value, c.currentTime);
      master.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.setTimeout(() => {
        if (!playing) void c.suspend();
      }, 800);
    },
  };
}
