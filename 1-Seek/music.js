const SeekMusic = (() => {
  const SCALE = [0, 3, 5, 7, 10];
  const STEP_DURATION = 360;
  const activeOscillators = new Set();
  let audioContext = null;
  let timerId = null;
  let playing = false;
  let step = 0;

  function playNote(midiNote, duration, waveform, volume) {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    const now = audioContext.currentTime;
    const end = now + duration;

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(440 * 2 ** ((midiNote - 69) / 12), now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(audioContext.destination);
    oscillator.onended = () => activeOscillators.delete(oscillator);
    activeOscillators.add(oscillator);
    oscillator.start(now);
    oscillator.stop(end + 0.02);
  }

  function playStep() {
    if (!playing) return;

    if (Math.random() > 0.16) {
      const octave = Math.floor(Math.random() * 3);
      const note = 60 + octave * 12 + SCALE[Math.floor(Math.random() * SCALE.length)];
      playNote(note, 0.28, 'sine', 0.09);
    }
    if (step % 4 === 0) {
      const bassNote = 36 + SCALE[Math.floor(Math.random() * SCALE.length)];
      playNote(bassNote, 0.6, 'triangle', 0.07);
    }

    step++;
    timerId = window.setTimeout(playStep, STEP_DURATION);
  }

  async function start() {
    if (playing) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Ce navigateur ne prend pas en charge Web Audio.');
    }

    if (!audioContext) audioContext = new AudioContextClass();
    playing = true;
    try {
      await audioContext.resume();
    } catch (error) {
      playing = false;
      throw error;
    }
    if (!playing) return;
    step = 0;
    playStep();
  }

  function stop() {
    playing = false;
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }

    const now = audioContext?.currentTime ?? 0;
    for (const oscillator of activeOscillators) {
      oscillator.stop(now + 0.03);
    }
  }

  return { start, stop };
})();
