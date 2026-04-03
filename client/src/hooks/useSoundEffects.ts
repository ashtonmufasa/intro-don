import { useCallback, useRef } from 'react';

// Web Audio API-based sound effects (no external files needed)
export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Countdown beep: short tone that gets higher on "1"
  const playCountdownBeep = useCallback((num: number) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Higher pitch for "1" (final count)
      const freq = num === 1 ? 880 : 440;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error('Countdown beep error:', e);
    }
  }, [getCtx]);

  // Correct answer: happy ascending tones
  const playCorrectSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';

        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {
      console.error('Correct sound error:', e);
    }
  }, [getCtx]);

  // Wrong answer: descending buzzer
  const playWrongSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
      osc.type = 'sawtooth';

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error('Wrong sound error:', e);
    }
  }, [getCtx]);

  return { playCountdownBeep, playCorrectSound, playWrongSound };
}
