// Browser-only audio helpers for "Sing it in my voice": decode, resample,
// slice, WAV-encode and mix. Uses the Web Audio API; no dependencies.

type AudioContextCtor = typeof AudioContext;

function ctor(): AudioContextCtor {
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  const C = w.AudioContext ?? w.webkitAudioContext;
  if (!C) throw new Error("This browser can't process audio. Try Chrome or Safari.");
  return C;
}

let shared: AudioContext | null = null;

export async function decodeAudio(data: ArrayBuffer | Blob): Promise<AudioBuffer> {
  shared ??= new (ctor())();
  const bytes = data instanceof Blob ? await data.arrayBuffer() : data;
  return shared.decodeAudioData(bytes);
}

/** Mix down to mono at `sampleRate`. */
export async function toMono(buf: AudioBuffer, sampleRate: number): Promise<Float32Array> {
  const length = Math.max(1, Math.ceil(buf.duration * sampleRate));
  const off = new OfflineAudioContext(1, length, sampleRate);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  return out.getChannelData(0);
}

/** 16-bit PCM WAV from one or more equal-length channels. */
export function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
  const numCh = channels.length;
  const frames = channels[0].length;
  const dataBytes = frames * numCh * 2;
  const view = new DataView(new ArrayBuffer(44 + dataBytes));
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));

  str(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, dataBytes, true);

  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}

function rms(data: Float32Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / Math.max(1, end - start));
}

export type Slice = { start: number; end: number; silent: boolean };

/**
 * Split a vocal track into slices of at most `maxSec`, cutting at the quietest
 * moment in the last few seconds of each window so cuts land between words.
 */
export function sliceVocals(data: Float32Array, sampleRate: number, maxSec = 12, minSec = 7): Slice[] {
  const frame = Math.round(sampleRate * 0.05);
  const slices: Slice[] = [];
  let start = 0;

  while (start < data.length) {
    let end = Math.min(data.length, start + maxSec * sampleRate);
    if (end < data.length) {
      let best = end;
      let bestRms = Infinity;
      for (let f = start + minSec * sampleRate; f + frame <= end; f += frame) {
        const r = rms(data, f, f + frame);
        if (r < bestRms) {
          bestRms = r;
          best = f + Math.floor(frame / 2);
        }
      }
      end = best;
    }
    slices.push({ start, end, silent: rms(data, start, end) < 0.004 });
    start = end;
  }
  return slices;
}

/** Run `fn` over `items` with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Lay the re-voiced slices back over the instrumental and render a stereo WAV.
 * Each slice gets a short fade in/out so the joins don't click.
 */
export async function mixToWav(
  instrumental: AudioBuffer,
  vocals: { buffer: AudioBuffer; at: number; duration: number }[],
): Promise<Blob> {
  const sr = instrumental.sampleRate;
  const off = new OfflineAudioContext(2, instrumental.length, sr);

  const music = off.createBufferSource();
  music.buffer = instrumental;
  music.connect(off.destination);
  music.start(0);

  const fade = 0.015;
  for (const v of vocals) {
    const dur = Math.min(v.duration, v.buffer.duration);
    if (dur <= 0) continue;
    const src = off.createBufferSource();
    src.buffer = v.buffer;
    const gain = off.createGain();
    gain.gain.setValueAtTime(0, v.at);
    gain.gain.linearRampToValueAtTime(1, v.at + fade);
    gain.gain.setValueAtTime(1, v.at + dur - fade);
    gain.gain.linearRampToValueAtTime(0, v.at + dur);
    src.connect(gain).connect(off.destination);
    src.start(v.at, 0, dur);
  }

  const out = await off.startRendering();
  return encodeWav([out.getChannelData(0), out.getChannelData(1)], sr);
}
