/**
 * A small original minimal-house loop, synthesised live with the Web Audio API (no samples, no files).
 * 120 BPM and deliberately sparse: a deep four-on-the-floor kick, tiny swung hats, a couple of ticks, a short
 * sub bass on the off-beats (root and a flat seventh, so it stays dark) and, now and then, one muted
 * minor chord that dissolves into a dark echo. The chord and echo duck on every kick (side-chain style).
 * Every kick also fires a `site:kick` event on window so the visuals can move with it.
 */
export type House = { start: () => Promise<void>; stop: () => void; readonly playing: boolean };

const BPM = 120;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const AHEAD = 0.12; // how far ahead notes are scheduled
const SWING = 0.15; // odd 16ths land a little late
const CHORD = [220.0, 261.63, 329.63]; // Am (A3 C4 E4), played soft and low-passed
const BASS = [55.0, 55.0, 55.0, 49.0]; // A1 A1 A1 G1, one per bar

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

    // chords and echo go through `pump`, which ducks on every kick; the echo is darkened on every repeat
    pump = ctx.createGain();
    const echo = ctx.createDelay(1);
    echo.delayTime.value = STEP * 3;
    const dark = ctx.createBiquadFilter();
    dark.type = 'lowpass';
    dark.frequency.value = 1500;
    const fb = ctx.createGain();
    fb.gain.value = 0.5;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    pump.connect(master);
    pump.connect(echo);
    echo.connect(dark).connect(fb).connect(echo);
    dark.connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };

  const kick = (t: number) => {
    const c = ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(125, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.1);
    g.gain.setValueAtTime(0.95, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.4);
    // duck the chord and echo
    pump.gain.cancelScheduledValues(t);
    pump.gain.setValueAtTime(0.25, t);
    pump.gain.linearRampToValueAtTime(1, t + 0.3);
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
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.22);
  };

  const chord = (t: number) => {
    const c = ctx!;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(800, t);
    f.frequency.exponentialRampToValueAtTime(260, t + 0.3);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    f.connect(g).connect(pump);
    for (const n of CHORD) {
      for (const det of [-7, 7]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = n;
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + 0.4);
      }
    }
  };

  const schedule = (s: number, t0: number) => {
    const inBar = s % 16;
    const bar = Math.floor(s / 16) % 4;
    const t = t0 + (inBar % 2 ? STEP * SWING : 0); // swing the odd 16ths
    if (inBar % 4 === 0) kick(t0);
    // a soft rim tick on the 2 of every other bar, plus two quiet syncopated ticks
    if (inBar === 4 && bar % 2 === 1) burst(t0, 'bandpass', 1900, 1.4, 0.18, 0.05);
    if (inBar === 7 || inBar === 11) burst(t, 'bandpass', 3600, 1.2, 0.09, 0.04);
    // hats: a tiny swung 16th texture, and a soft open hat on the off-beat
    if (inBar % 4 === 2) burst(t0, 'highpass', 7800, 0.7, 0.13, 0.09);
    else burst(t, 'highpass', 9500, 0.7, inBar % 2 ? 0.045 : 0.03, 0.025);
    // sub bass on the off-beats
    if (inBar % 4 === 2) bass(t0, BASS[bar]);
    // one muted chord, only now and then
    if ((bar % 2 === 0 && inBar === 3) || (bar === 3 && inBar === 10)) chord(t);
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
      master.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.4);
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
