/**
 * 사찰의 깊은 종소리 + 싱잉볼 3중 화음 신명 앰비언트 합성기
 * - 432Hz 고주파 삐소리 완전 삭제
 * - 60Hz, 108Hz, 174Hz 초저음역대 3중 화음 오실레이터
 * - 400Hz 이하 컷오프 로우패스 필터 (360Hz)로 날카로운 기계음 완전 제거 및 몽환적인 밤안개 사운드 연출
 * - 마스터 게인 0.06 (0.05~0.08 범위)으로 편안한 명상 배경음 구현
 */

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

interface BiquadFilterLike {
  type: string;
  frequency: ParamLike;
  Q: ParamLike;
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

interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  state: string;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  createBiquadFilter(): BiquadFilterLike;
  resume(): Promise<void>;
  close(): Promise<void>;
}

const FADE_IN_SECONDS = 2.0;
const FADE_OUT_SECONDS = 1.0;
const MASTER_GAIN = 0.06; // 0.05 ~ 0.08 범위의 편안한 명상 음량
const LOWPASS_CUTOFF_HZ = 360; // 400Hz 이하 컷오프

interface ActiveSynth {
  ctx: AudioContextLike;
  master: GainLike;
  filter: BiquadFilterLike;
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

/** 사용자의 터치 직후에 호출해야 브라우저의 자동재생 제한을 통과한다. */
export function startAmbient(): boolean {
  if (active) return true;
  const ctx = createContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;

    // 1. 마스터 게인 노드 (0.06 목표, 서서히 페이드인)
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(MASTER_GAIN, now + FADE_IN_SECONDS);
    master.connect(ctx.destination);

    // 2. 로우패스 필터 (Low-pass filter, 400Hz 이하 컷오프)
    // 날카로운 기계음을 전면 제거하고 사찰의 깊은 밤안개 느낌 연출
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(LOWPASS_CUTOFF_HZ, now);
    filter.Q.setValueAtTime(1.2, now);
    filter.connect(master);

    // 3. 깊고 웅장한 사찰 싱잉볼 3중 화음 베이스 드론 (60Hz, 108Hz, 174Hz)
    // 60Hz: 대지의 깊은 진동 (Root drone)
    // 108Hz: 사찰 108 번뇌 타종 싱잉볼 기음 (Singing bowl resonance)
    // 174Hz: 솔페지오 힐링 주파수 (Healing overtone)
    const droneLayers: Array<{ freq: number; gain: number; type: string }> = [
      { freq: 60, gain: 0.65, type: 'sine' },
      { freq: 108, gain: 0.50, type: 'sine' },
      { freq: 174, gain: 0.35, type: 'sine' },
    ];

    const oscillators: OscillatorLike[] = [];

    for (const layer of droneLayers) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = layer.type;
      osc.frequency.setValueAtTime(layer.freq, now);
      oscGain.gain.setValueAtTime(layer.gain, now);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      oscillators.push(osc);
    }

    // 4. 싱잉볼 특유의 잔잔한 호흡 진동 (극저주파 LFO: 0.08Hz)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, now);
    lfoGain.gain.setValueAtTime(MASTER_GAIN * 0.25, now);

    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
    oscillators.push(lfo);

    void ctx.resume().catch(() => undefined);
    active = { ctx, master, filter, oscillators };
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

  const { ctx, master, filter, oscillators } = current;
  try {
    const now = ctx.currentTime;
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
  } catch {
    // 페이드아웃 실패 시 즉시 정리
  }

  setTimeout(() => {
    for (const osc of oscillators) {
      try {
        osc.stop();
      } catch {}
    }
    try {
      filter.disconnect();
      master.disconnect();
    } catch {}
    void ctx.close().catch(() => undefined);
  }, 1100);
}
