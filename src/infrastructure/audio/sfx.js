// Sons chiptune générés avec Web Audio, et bouton muet.

export const SOUND_KEY = "breakpoint.sound";

export let audioCtx = null;

export let masterGain = null;

export let noiseBuffer = null;

export let muted = readMuted();

export const muteListeners = new Set();

export function readMuted() {
  try {
    return localStorage.getItem(SOUND_KEY) === "off";
  } catch {
    return false;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(e) {
  muted = e;
  try {
    localStorage.setItem(SOUND_KEY, e ? "off" : "on");
  } catch { }
  muteListeners.forEach((t) => t(e));
  if (!e) {
    sfx.click();
  }
}

export function onMuteChange(e) {
  muteListeners.add(e);
  return () => muteListeners.delete(e);
}

export function getAudio() {
  if (muted) {
    return null;
  }
  try {
    if (!audioCtx) {
      let e = window.AudioContext ?? window.webkitAudioContext;
      if (!e) {
        return null;
      }
      audioCtx = new e();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.32;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function tone(e, t, o = {}) {
  let a = getAudio();
  if (!a || !masterGain) {
    return;
  }
  let r = a.currentTime + (o.at ?? 0);
  let n = a.createOscillator();
  let l = a.createGain();
  n.type = o.wave ?? "square";
  n.frequency.setValueAtTime(e, r);
  if (o.slide) {
    n.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), r + t);
  }
  let d = o.vol ?? 0.25;
  l.gain.setValueAtTime(1e-4, r);
  l.gain.exponentialRampToValueAtTime(d, r + 5e-3);
  l.gain.exponentialRampToValueAtTime(1e-4, r + t);
  n.connect(l).connect(masterGain);
  n.start(r);
  n.stop(r + t + 0.02);
}

export function noise(e, t = {}) {
  let o = getAudio();
  if (!o || !masterGain) {
    return;
  }
  if (!noiseBuffer) {
    noiseBuffer = o.createBuffer(1, o.sampleRate, o.sampleRate);
    let u = noiseBuffer.getChannelData(0);
    for (let i = 0; i < u.length; i++) {
      u[i] = Math.random() * 2 - 1;
    }
  }
  let a = o.currentTime + (t.at ?? 0);
  let r = o.createBufferSource();
  r.buffer = noiseBuffer;
  r.loop = true;
  let n = o.createBiquadFilter();
  n.type = t.type ?? "bandpass";
  n.frequency.setValueAtTime(t.from ?? 1200, a);
  if (t.to) {
    n.frequency.exponentialRampToValueAtTime(t.to, a + e);
  }
  let l = o.createGain();
  let d = t.vol ?? 0.3;
  l.gain.setValueAtTime(1e-4, a);
  l.gain.exponentialRampToValueAtTime(d, a + 0.01);
  l.gain.exponentialRampToValueAtTime(1e-4, a + e);
  r.connect(n).connect(l).connect(masterGain);
  r.start(a);
  r.stop(a + e + 0.02);
}

export const semitone = (e, t) => e * Math.pow(2, t / 12);

export const PENTATONIC = [0, 2, 4, 7, 9];

export const pentatonicNote = (e, t) => semitone(e, PENTATONIC[t % 5] + 12 * Math.floor(t / 5));

export let lastActivateAt = 0;

export function tooSoon() {
  let e = performance.now();
  return e - lastActivateAt < 35 ? true : (lastActivateAt = e, false);
}

export const sfx = {
  click() {
    tone(1400, 0.03, { wave: "square", vol: 0.08 });
  },
  activate(e, t) {
    if (tooSoon()) {
      return;
    }
    let o = pentatonicNote(330, Math.min(e, 17));
    tone(o, 0.09, { wave: "square", vol: 0.16 });
    if (t) {
      tone(o * 1.5, 0.12, { wave: "square", vol: 0.12, at: 0.03 });
    }
  },
  scale() {
    if (!tooSoon()) {
      noise(0.07, { from: 3e3, vol: 0.32, type: "highpass" });
      tone(180, 0.12, { wave: "square", vol: 0.22, slide: 90 });
    }
  },
  boost() {
    tone(660, 0.07, { wave: "triangle", vol: 0.2 });
    tone(990, 0.1, { wave: "triangle", vol: 0.2, at: 0.06 });
  },
  retrigger() {
    if (!tooSoon()) {
      [0, 4, 7].forEach((e, t) => tone(semitone(523, e), 0.06, { wave: "square", vol: 0.12, at: t * 0.035 }));
    }
  },
  joker() {
    if (!tooSoon()) {
      tone(880, 0.14, { wave: "triangle", vol: 0.22 });
      tone(1320, 0.18, { wave: "triangle", vol: 0.16, at: 0.05 });
    }
  },
  fail() {
    tone(220, 0.18, { wave: "sawtooth", vol: 0.14, slide: 110 });
  },
  crash() {
    noise(0.35, { from: 1800, to: 200, vol: 0.35 });
    tone(300, 0.35, { wave: "sawtooth", vol: 0.18, slide: 60 });
  },
  deploy() {
    [0, 4, 7, 12].forEach((e, t) => tone(semitone(262, e), 0.08, { wave: "square", vol: 0.15, at: t * 0.05 }));
  },
  fire(e) {
    noise(0.6 + e * 0.15, { from: 400, to: 4e3, vol: 0.28 + e * 0.05 });
    tone(523, 0.12, { wave: "square", vol: 0.14, at: 0.05 });
    tone(784, 0.18, { wave: "square", vol: 0.14, at: 0.12 });
  },
  score(e) {
    tone(e ? 784 : 523, 0.16, { wave: "square", vol: 0.18 });
    tone(e ? 1047 : 659, 0.22, { wave: "square", vol: 0.16, at: 0.08 });
  },
  cash() {
    tone(1319, 0.07, { wave: "square", vol: 0.14 });
    tone(1760, 0.22, { wave: "square", vol: 0.14, at: 0.07 });
    noise(0.05, { from: 6e3, vol: 0.1, type: "highpass", at: 0.07 });
  },
  sell() {
    tone(1760, 0.06, { wave: "square", vol: 0.12 });
    tone(1175, 0.14, { wave: "square", vol: 0.12, at: 0.06 });
  },
  upgrade() {
    [0, 4, 7].forEach((e, t) => tone(semitone(440, e), 0.08, { wave: "triangle", vol: 0.2, at: t * 0.06 }));
  },
  fusion() {
    noise(0.4, { from: 300, to: 3e3, vol: 0.2 });
    [0, 4, 7, 12, 16].forEach((e, t) => tone(semitone(330, e), 0.14, { wave: "square", vol: 0.13, at: 0.1 + t * 0.06 }));
  },
  goodie() {
    noise(0.12, { from: 2500, to: 600, vol: 0.18 });
    tone(988, 0.08, { wave: "triangle", vol: 0.2, at: 0.1 });
    tone(1480, 0.16, { wave: "triangle", vol: 0.2, at: 0.17 });
  },
  pack() {
    noise(0.25, { from: 5e3, to: 1500, vol: 0.16, type: "highpass" });
    [0, 3, 5, 8, 12].forEach((e, t) => tone(semitone(262, e), 0.07, { wave: "square", vol: 0.11, at: 0.12 + t * 0.08 }));
  },
  reveal() {
    noise(0.3, { from: 400, to: 5e3, vol: 0.22 });
    [0, 4, 7].forEach((e, t) => tone(semitone(523, e), 0.12, { wave: "triangle", vol: 0.18, at: 0.05 + t * 0.12 }));
  },
  reroll() {
    for (let e = 0; e < 4; e++) {
      tone(semitone(600, e * 3), 0.04, { wave: "square", vol: 0.09, at: e * 0.04 });
    }
  },
  unlock() {
    tone(392, 0.06, { wave: "square", vol: 0.15 });
    tone(784, 0.14, { wave: "square", vol: 0.15, at: 0.06 });
  },
  error() {
    tone(140, 0.16, { wave: "square", vol: 0.15 });
    tone(110, 0.2, { wave: "square", vol: 0.15, at: 0.1 });
  },
  victory() {
    [0, 4, 7, 12, 7, 12, 16, 19].forEach((e, t) => tone(semitone(392, e), 0.16, { wave: "square", vol: 0.15, at: t * 0.11 }));
  },
  defeat() {
    [7, 6, 5, 0].forEach((e, t) => tone(semitone(262, e), t === 3 ? 0.5 : 0.22, { wave: "square", vol: 0.15, at: t * 0.22 }));
  },
};
