// All effects are local: no trackers, remote audio or rendering libraries.
const palette = ["#ffcd00", "#f43140", "#aa1a80", "#6334ae", "#118bdd", "#06b776"];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let audio;
let sound = false;
export const soundEnabled = () => sound;

export async function toggleSound() {
  sound = !sound;
  if (sound) {
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume(); }
    catch { sound = false; }
  }
  return sound;
}

function chime(notes = [523, 659, 784, 1046]) {
  if (!sound || !audio) return;
  notes.forEach((frequency, index) => {
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    const time = audio.currentTime + index * .095;
    oscillator.type = "sine"; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(.07, time + .025);
    gain.gain.exponentialRampToValueAtTime(.001, time + .6);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(time); oscillator.stop(time + .65);
  });
}

export function wheelAngle(index, count) {
  return 1800 + 360 - (index + .5) * (360 / count);
}

export function wheelScene(prizes) {
  const moments = ["UAAU!", "✦", "SEGURA!", "BOOM!", "VAI!", "PIROMAX", "SORTE", "FESTA!"];
  const step = 360 / moments.length;
  const gradient = moments.map((_, i) => `${palette[i % palette.length]} ${i * step}deg ${(i + 1) * step}deg`).join(",");
  return `<div class="wheel-wrap"><div class="pointer" aria-hidden="true">▼</div><div class="wheel" style="--rotation:0deg;background:conic-gradient(${gradient})" aria-label="Roda Piromax">${moments.map((moment, index) => `<span class="wheel-moment" style="--angle:${(index + .5) * step}deg">${moment}</span>`).join("")}</div><div class="wheel-center"><img src="assets/logo-piromax-small.png" alt="Piromax" /></div></div>`;
}

export async function playSpin(wheel, index, count) {
  chime([262, 330, 392]);
  wheel.style.setProperty("--rotation", `${wheelAngle(index, count)}deg`);
  if (reduced()) return;
  await new Promise(resolve => setTimeout(resolve, 3100));
}

export async function anticipation() {
  if (reduced()) return;
  const overlay = document.createElement("div");
  overlay.className = "reveal-countdown";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Preparando a revelação do presente");
  overlay.innerHTML = '<div class="count-orbit"></div><p class="eyebrow">ESSE MOMENTO É SEU</p><strong aria-hidden="true">3</strong><p>Pronto para descobrir?</p><button class="skip-reveal">Revelar agora</button>';
  document.body.append(overlay);
  const previous = document.activeElement;
  const skip = overlay.querySelector("button");
  skip.focus();
  await new Promise(resolve => {
    let value = 3;
    const end = () => { clearInterval(timer); overlay.remove(); previous?.focus(); resolve(); };
    const timer = setInterval(() => { value--; if (!value) end(); else overlay.querySelector("strong").textContent = value; }, 650);
    skip.onclick = end;
    overlay.onkeydown = event => { if (event.key === "Escape") end(); if (event.key === "Tab") { event.preventDefault(); skip.focus(); } };
  });
}

export function celebrate() {
  chime();
  if (reduced()) return;
  navigator.vibrate?.([35, 50, 60]);
  const burst = document.createElement("div"); burst.className = "prize-burst"; burst.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 52; i++) {
    const piece = document.createElement("i");
    const angle = i * 2.39996;
    piece.style.cssText = `--x:${Math.cos(angle) * (120 + i * 5)}px;--y:${Math.sin(angle) * (100 + i * 4)}px;--turn:${i * 39}deg;--delay:${i % 6 * 25}ms;background:${palette[i % palette.length]}`;
    burst.append(piece);
  }
  document.body.append(burst);
  setTimeout(() => burst.remove(), 2200);
}
