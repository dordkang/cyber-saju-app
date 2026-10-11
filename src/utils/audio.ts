/**
 * Web Audio API 기반 몽환적 오르골/사찰 멜로디 루프 엔진 (오음계 펜타토닉)
 * - C4, D4, E4, G4, A4 / C5, D5, E5, G5, A5 궁상각치우 5음계
 * - 16단계 신비로운 선율 시퀀스
 * - 사인파 + 부드러운 벨 감쇠 (어택 0.05s, 릴리즈 2.2s)
 * - 4박자마다 은은한 저음 베이스 울림 (freq / 2)
 */

class SajuAmbientEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: any = null;
  private currentStep: number = 0;

  // 동양 5음계 (C, D, E, G, A 기반 몽환적 멜로디 주파수: Hz)
  private melodyNotes: number[] = [
    261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
  ];

  // 16단계 신비로운 선율 시퀀스 패턴 (인덱스)
  private sequence: number[] = [
    0, 2, 4, 3,  2, 0, 1, 3,
    4, 6, 7, 5,  4, 3, 1, 0,
  ];

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
  }

  // 부드러운 오르골/풍경소리 단음 연주 (부드러운 감쇠)
  private playBellNote(freq: number, time: number) {
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // 몽환적인 음색을 위한 사인파 + 부드러운 고음 처리
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // 어택(빠름) & 릴리즈(길고 부드럽게 감쇠)
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 2.3);
    } catch {
      // 오디오 노드 에러 방어
    }
  }

  // 멜로디 루프 스케줄러 (느리고 몽환적인 템포: 1초당 1~2음)
  private tick = () => {
    if (!this.isPlaying || !this.ctx) return;

    const noteIdx = this.sequence[this.currentStep % this.sequence.length];
    const freq = this.melodyNotes[noteIdx];
    const now = this.ctx.currentTime;

    this.playBellNote(freq, now);

    // 4마디마다 은은한 저음 베이스 울림 추가
    if (this.currentStep % 4 === 0) {
      this.playBellNote(freq / 2, now);
    }

    this.currentStep++;
    this.timerId = setTimeout(this.tick, 750); // 편안한 호흡의 템포
  };

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  public start(): boolean {
    try {
      this.initContext();
      if (!this.ctx) return false;
      if (this.isPlaying) return true;
      this.isPlaying = true;
      this.currentStep = 0;
      this.tick();
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const sajuAudio = new SajuAmbientEngine();

export const startAmbient = (): boolean => {
  return sajuAudio.start();
};

export const stopAmbient = (): void => {
  sajuAudio.stop();
};

export const isAmbientSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.AudioContext || (window as any).webkitAudioContext)
  );
};
