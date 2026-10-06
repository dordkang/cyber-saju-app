interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  state: string;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): Promise<void>;
  close(): Promise<void>;
}
interface ParamLike {
  value: number;
  setValueAtTime(value: number, time: number): void;
  linearRampToValueAtTime(value: number, time: number): void;
}
interface GainLike {
  gain: ParamLike;
  connect(target: unknown): void;
  disconnect(): void;
}
interface OscillatorLike {
  type: string;
  frequency: ParamLike;
  connect(target: unknown): void;
  start(): void;
  stop(): void;
}

/** 432Hz를 기준음으로 삼는 느린 앰비언트 드론. 웹 오디오 API가 있는 브라우저에서만 동작한다. */
const BASE_HZ = 432;
const FADE_SECONDS = 1.2;
const MASTER_GAIN = 0.12;

interface ActiveSynth {
  ctx: AudioContextLike;
  master: GainLike;
  oscillators: OscillatorLike[];
}

let active: ActiveSynth | null = null;

function createContext(): AudioContextLike | null {
  try {
    const scope = globalThis as unknown as {
      AudioContext?: new () => AudioContextLike;
      webkitAudioContext?: new () => AudioContextLike;
    };
    const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

export function isAmbientSupported(): boolean {
  const scope = globalThis as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown };
  return Boolean(scope.AudioContext ?? scope.webkitAudioContext);
}

/** 사용자의 터치 직후에 호출해야 브라우저의 자동재생 제한을 통과한다. 성공 여부를 반환한다. */
export function startAmbient(): boolean {
  if (active) return true;
  const ctx = createContext();
  if (!ctx) return false;

  try {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(MASTER_GAIN, ctx.currentTime + FADE_SECONDS);
    master.connect(ctx.destination);

    // 기준음 + 한 옥타브 아래 + 완전5도 위를 아주 작은 음량으로 겹쳐 두껍게 깔고, 느린 떨림을 준다.
    const layers: Array<{ ratio: number; gain: number; type: string }> = [
      { ratio: 1, gain: 0.55, type: 'sine' },
      { ratio: 0.5, gain: 0.35, type: 'sine' },
      { ratio: 1.5, gain: 0.12, type: 'triangle' },
    ];
    const oscillators: OscillatorLike[] = [];
    for (const layer of layers) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = layer.type;
      osc.frequency.setValueAtTime(BASE_HZ * layer.ratio, ctx.currentTime);
      gain.gain.setValueAtTime(layer.gain, ctx.currentTime);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      oscillators.push(osc);
    }

    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
    lfoDepth.gain.setValueAtTime(MASTER_GAIN * 0.35, ctx.currentTime);
    lfo.connect(lfoDepth);
    lfoDepth.connect(master.gain);
    lfo.start();
    oscillators.push(lfo);

    void ctx.resume().catch(() => undefined);
    active = { ctx, master, oscillators };
    return true;
  } catch {
    void ctx.close().catch(() => undefined);
    return false;
  }
}

export function stopAmbient(): void {
  const current = active;
  if (!current) return;
  active = null;

  const { ctx, master, oscillators } = current;
  try {
    const now = ctx.currentTime;
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.5);
  } catch {
    // 페이드아웃 실패 시에는 바로 정리한다.
  }
  setTimeout(() => {
    for (const osc of oscillators) {
      try {
        osc.stop();
      } catch {
        // 이미 멈춘 노드는 무시한다.
      }
    }
    master.disconnect();
    void ctx.close().catch(() => undefined);
  }, 600);
}
