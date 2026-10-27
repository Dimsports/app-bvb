// Sonnerie façon minuteur iPhone : bip de synthèse (Web Audio, pas de
// fichier son) répété jusqu'à l'arrêt, plus vibration si disponible.

export function createAlarm() {
  let audioCtx: AudioContext | null = null;
  let beepIntervalId: number | null = null;

  function getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  }

  // À appeler lors d'un geste utilisateur (ex. démarrage du minuteur) pour
  // débloquer l'audio avant que l'alarme n'en ait besoin.
  function prime() {
    const ctx = getContext();
    if (ctx?.state === "suspended") {
      ctx.resume();
    }
  }

  function beep() {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  function start() {
    prime();
    beep();
    beepIntervalId = window.setInterval(beep, 900);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([300, 200, 300]);
    }
  }

  function stop() {
    if (beepIntervalId !== null) {
      window.clearInterval(beepIntervalId);
      beepIntervalId = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  }

  return { prime, start, stop };
}

export type Alarm = ReturnType<typeof createAlarm>;
