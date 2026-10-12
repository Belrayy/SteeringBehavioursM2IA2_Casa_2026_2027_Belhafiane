import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function createMusicContext(audioSupported = true) {
  const timers = new Map();
  const calls = { oscillators: [], clearedTimers: [] };
  let nextTimerId = 1;

  class AudioParam {
    setValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
  }
  class AudioContext {
    currentTime = 10;
    destination = {};
    state = 'running';
    async resume() { calls.resumed = true; }
    createOscillator() {
      const oscillator = {
        frequency: new AudioParam(),
        connect() {},
        start() { this.started = true; },
        stop(time) { this.stoppedAt = time; },
      };
      calls.oscillators.push(oscillator);
      return oscillator;
    }
    createGain() {
      return { gain: new AudioParam(), connect() {} };
    }
  }

  const context = vm.createContext({
    Math: Object.create(Math),
    window: {
      ...(audioSupported ? { AudioContext } : {}),
      setTimeout(callback, delay) {
        const id = nextTimerId++;
        timers.set(id, { callback, delay });
        return id;
      },
      clearTimeout(id) {
        calls.clearedTimers.push(id);
        timers.delete(id);
      },
    },
  });
  vm.runInContext(readFileSync(new URL('../music.js', import.meta.url), 'utf8'), context);
  return { context, calls, timers };
}

test('music starts a randomly composed melody and stop cancels it', async () => {
  const { context, calls, timers } = createMusicContext();
  await vm.runInContext('SeekMusic.start()', context);

  assert.equal(calls.resumed, true);
  assert.ok(calls.oscillators.length >= 1);
  assert.ok(calls.oscillators.every(oscillator => oscillator.started));
  assert.equal(timers.size, 1);
  assert.equal([...timers.values()][0].delay, 360);

  vm.runInContext('SeekMusic.stop()', context);
  assert.equal(timers.size, 0);
  assert.deepEqual(calls.clearedTimers, [1]);
  assert.ok(calls.oscillators.every(oscillator => oscillator.stoppedAt !== undefined));
});

test('music reports unsupported Web Audio instead of failing silently', async () => {
  const { context } = createMusicContext(false);
  await assert.rejects(
    vm.runInContext('SeekMusic.start()', context),
    /does not support|ne prend pas en charge/,
  );
});
