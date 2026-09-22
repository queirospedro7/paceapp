// Pace — Áudio, alarmes e visualizador de som

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    return audioCtx.resume().then(() => audioCtx);
  }
  return Promise.resolve(audioCtx);
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  getAudioContext().then(ctx => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }).catch(() => {});
}

function playTick(type) {
  if (!type || type === 'off') return;
  const vol = ((settings.volume || 70) / 100) * 0.15;
  if (type === 'soft') {
    playTone(600, 0.02, 'sine', vol * 0.8);
  } else if (type === 'mechanical') {
    playTone(1400, 0.015, 'triangle', vol * 1.2);
  }
}

/* ── Alarm sounds ───────────────────────────────────────────── */
function playAlarmSound(soundType, volOverride) {
  const volume = volOverride != null ? volOverride : (settings.volume || 70) / 100;

  switch(soundType) {
    case 'digital':
      playTone(880, 0.15, 'square', volume * 0.3);
      setTimeout(() => playTone(660, 0.15, 'square', volume * 0.3), 150);
      setTimeout(() => playTone(880, 0.15, 'square', volume * 0.3), 300);
      setTimeout(() => playTone(660, 0.15, 'square', volume * 0.3), 450);
      setTimeout(() => playTone(880, 0.3, 'square', volume * 0.3), 600);
      break;
    case 'bell':
      playTone(523, 0.8, 'sine', volume * 0.5);
      setTimeout(() => playTone(659, 0.8, 'sine', volume * 0.4), 200);
      setTimeout(() => playTone(784, 1.2, 'sine', volume * 0.3), 400);
      break;
    case 'chime':
      playTone(1047, 0.5, 'sine', volume * 0.4);
      setTimeout(() => playTone(1319, 0.5, 'sine', volume * 0.35), 150);
      setTimeout(() => playTone(1568, 0.8, 'sine', volume * 0.3), 300);
      break;
    case 'soft':
      playTone(392, 0.9, 'sine', volume * 0.22);
      setTimeout(() => playTone(523, 1.1, 'sine', volume * 0.18), 260);
      break;
    case 'bowl':
      playTone(196, 1.8, 'sine', volume * 0.28);
      setTimeout(() => playTone(392, 1.6, 'sine', volume * 0.12), 90);
      setTimeout(() => playTone(588, 1.2, 'sine', volume * 0.08), 180);
      break;
    case 'rain':
      for (let i = 0; i < 10; i++) {
        setTimeout(() => playTone(900 + Math.random() * 500, 0.05, 'sine', volume * 0.08), i * 90);
      }
      setTimeout(() => playTone(330, 0.7, 'sine', volume * 0.12), 220);
      break;
    case 'waves':
      playTone(247, 1.1, 'sine', volume * 0.16);
      setTimeout(() => playTone(294, 1.1, 'sine', volume * 0.14), 360);
      setTimeout(() => playTone(220, 1.2, 'sine', volume * 0.12), 720);
      break;
    case 'lofi':
      playTone(262, 0.55, 'triangle', volume * 0.18);
      setTimeout(() => playTone(330, 0.55, 'triangle', volume * 0.16), 180);
      setTimeout(() => playTone(392, 0.75, 'triangle', volume * 0.14), 360);
      break;
    case 'beep':
      playTone(1000, 0.1, 'sine', volume * 0.5);
      setTimeout(() => playTone(1000, 0.1, 'sine', volume * 0.5), 200);
      setTimeout(() => playTone(1000, 0.1, 'sine', volume * 0.5), 400);
      setTimeout(() => playTone(1500, 0.2, 'sine', volume * 0.5), 600);
      break;
    case 'alarm':
      for (let i = 0; i < 6; i++) {
        setTimeout(() => playTone(800 + (i % 3) * 200, 0.12, 'sawtooth', volume * 0.25), i * 120);
      }
      break;
    case 'nature':
      playTone(2000, 0.1, 'sine', volume * 0.3);
      setTimeout(() => playTone(2500, 0.08, 'sine', volume * 0.25), 150);
      setTimeout(() => playTone(1800, 0.12, 'sine', volume * 0.3), 300);
      setTimeout(() => playTone(2200, 0.1, 'sine', volume * 0.25), 500);
      setTimeout(() => playTone(2800, 0.08, 'sine', volume * 0.2), 700);
      break;
    default:
      playTone(880, 0.5, 'sine', volume * 0.5);
  }
}

function updateVolumeLabel() {
  const el = document.getElementById('setting-volume');
  const lbl = document.getElementById('volume-label');
  if (!el) return;
  const val = parseInt(el.value) || 0;
  if (lbl) lbl.textContent = val + '%';
  const pct = val + '%';
  el.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}, var(--s3) ${pct}, var(--s3) 100%)`;
}

function previewAlarmSound() {
  const soundType = document.getElementById('setting-alarm-sound')?.value || 'digital';
  playAlarmSound(soundType);
}

/* ── Sound visualizer ───────────────────────────────────────── */
let soundVizInterval = null;

function tickVizBars(bars, anim) {
  const now = performance.now() / 1000;
  const n = bars.length;
  const mid = (n - 1) / 2;
  let h;
  for (let i = 0; i < n; i++) {
    switch (anim) {
      case 'static':  h = 4; break;
      case 'wave':    h = 4 + (Math.sin(now * 3 + i * 0.45) + 1) * 11; break;
      case 'pulse':   h = 4 + (Math.sin(now * 4) + 1) * 12; break;
      case 'bounce':  h = 4 + Math.abs(Math.sin(now * 5 + i * 0.8)) * 22; break;
      case 'ripple':  h = 4 + Math.abs(Math.sin(now * 2 - i * 0.35)) * 20; break;
      case 'calm':    h = 4 + (Math.sin(now * 1.2 + i * 0.3) + 1) * 6; break;
      case 'breathe': h = 4 + (Math.sin(now * 0.8) + 1) * 8 + Math.sin(now * 2.1 + i * 0.6) * 4; break;
      case 'cascade': h = 4 + Math.abs(Math.sin(now * 3 + i * 0.9)) * 18; break;
      case 'mirror':  h = 4 + (Math.sin(now * 2.5 + Math.min(i, n - 1 - i) * 0.5) + 1) * 10; break;
      case 'spectrum':h = 4 + (1 - Math.abs(i - mid) / (mid || 1)) * (10 + Math.sin(now * 2 + i) * 8); break;
      case 'strobe':  h = Math.sin(now * 8) > 0.2 ? 8 + Math.random() * 16 : 5; break;
      case 'bars':    h = 4 + Math.random() * 20; break;
      case 'digital': h = Math.random() > 0.35 ? 6 + Math.random() * 18 : 4; break;
      case 'idle':    h = 5 + Math.random() * 3; break;
      default:        h = 4 + Math.random() * 20;
    }
    bars[i].style.height = Math.round(h) + 'px';
  }
}
