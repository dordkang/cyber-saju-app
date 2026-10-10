import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

export type Locale = 'ko' | 'ja';

const STORAGE_KEY = 'cyber_saju_lang';

export function detectInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ko' || saved === 'ja') {
        return saved;
      }
      const nav =
        (typeof navigator !== 'undefined' &&
          (navigator.language || (navigator.languages && navigator.languages[0]))) ||
        '';
      if (nav.toLowerCase().startsWith('ja')) {
        return 'ja';
      }
    } catch {
      // ignore security/storage errors
    }
  }
  return 'ko';
}

let activeLocale: Locale = detectInitialLocale();
const listeners = new Set<(loc: Locale) => void>();

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(next: Locale): void {
  if (activeLocale === next) return;
  activeLocale = next;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent('cyber_saju_lang_change', { detail: next }));
    } catch {
      // ignore
    }
  }
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch (e) {
      console.error(e);
    }
  });
}

export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
  isJa: boolean;
} {
  const [locale, setLocal] = useState<Locale>(activeLocale);

  useEffect(() => {
    const handler = (next: Locale) => setLocal(next);
    listeners.add(handler);

    // window storage / custom event listener
    const onCustomEvent = (e: any) => {
      if (e?.detail && (e.detail === 'ko' || e.detail === 'ja')) {
        setLocal(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cyber_saju_lang_change', onCustomEvent);
    }

    return () => {
      listeners.delete(handler);
      if (typeof window !== 'undefined') {
        window.removeEventListener('cyber_saju_lang_change', onCustomEvent);
      }
    };
  }, []);

  return {
    locale,
    setLocale,
    isJa: locale === 'ja',
  };
}

export const DICTIONARY = {
  ko: {
    // 1. 앱 헤더 및 기본 정체성
    appTitle: 'CYBER-SAJU // 영혼의 주파수',
    appSubtitle: 'LOCAL EDGE AI 四柱推命',
    appBrand: 'CYBER-SAJU // LOCAL EDGE AI',

    // 2. 릴스 섹션 키커 / 타이틀 / 서브타이틀
    sections: {
      omen: {
        kicker: '오늘의 징조',
        title: '하늘이 오늘\n보내는 신호',
        subtitle: '일진과 본원이 부딪히는 지점을 한 장으로 읽어요.',
        headerBadge: '오늘이 보내는 신호',
      },
      life: {
        kicker: '인생 · 대운',
        title: '10년마다 바뀌는\n인생의 파도',
        subtitle: '지금 타고 있는 대운부터 앞으로 올 파도까지.',
        headerBadge: '인생 10년 대운',
      },
      people: {
        kicker: '사람 · 속마음',
        title: '상대의 딴마음\n레이더',
        subtitle: '내 사람 사주 속 도화와 이별수를 짚어요.',
        headerBadge: '상대 속마음 레이더',
      },
      money: {
        kicker: '돈 · 흐름',
        title: '오늘의 돈 버는 엔진\n지갑 방어선',
        subtitle: '벌리는 기운과 새는 구멍을 숫자로 봐요.',
        headerBadge: '돈의 유입과 방어선',
      },
      celebrity: {
        kicker: '영혼의 공명',
        title: '나와 같은 결의\n유명인 매칭',
        subtitle: '일간과 오행이 겹치는 사람을 로컬에서 고릅니다.',
        headerBadge: '영혼의 공명 매트릭스',
      },
      mbti: {
        kicker: '페르소나 전술실',
        title: '선천 사주 코어\nvs 현실 가면',
        subtitle: '동양의 사주 오행과 서양의 MBTI로 풀어내는 나의 에너지 누수 리포트',
        headerBadge: '선천 사주 코어 vs 현실 가면',
      },
      circuit: {
        kicker: '오행 카운셀링',
        title: '선천 오행 DNA\n& 결핍 돌파 솔루션',
        subtitle: '타고난 최강의 무기와 가장 치명적인 아킬레스건을 짚고, 현실의 보완책을 처방합니다.',
        headerBadge: '선천 오행 DNA & 결핍 돌파',
      },
      chamber: {
        kicker: '체임버 · 설정',
        title: '비밀의 방\n체임버',
        subtitle: '도사 말투와 기기 설정은 여기서 바꿉니다.',
        headerBadge: '비밀의 방 체임버',
      },
    },

    // 3. 주요 기능 및 버튼
    settle3Sec: '⚡ 하루 3초 오행 정산',
    settleDesc: '오늘 마주친 사건과 감정을 3초 만에 오행으로 정산합니다.',
    settleDoneBadge: '⚡ 오늘의 오행 정산 완료',
    reSettleBtn: '🔄 다시 정산하기',
    tomorrowStrategy: '내일의 천기 & 작전 설계',
    tomorrowDesc: '오늘 정산한 에너지를 기반으로 내일의 승부수를 설계합니다.',
    tomorrowDesignCta: '🎯 내일 작전 설계 시작하기',
    tomorrowComplete: '🔒 내일 작전 브리핑 해금됨',

    // 4. 5대 분야 카테고리
    categories: {
      wealth: '재물',
      love: '사랑',
      career: '직업',
      health: '건강',
      business: '비즈니스',
    },

    // 5. 날짜 컨트롤
    today: '오늘',
    prevDay: '이전 날',
    nextDay: '다음 날',
    dateSelector: '날짜 변경',

    // 6. 소셜 공유 및 모달
    shareInsta: '인스타 스토리에 공유하기',
    shareTwitter: '𝕏에 결과 공유하기',
    postTwitter: '𝕏 포스트하기',
    close: '닫기',
    capturing: '📸 스토리 캡처 중...',

    // 7. Twitter 공유 템플릿
    twitterShareText: (celebName: string, rate: number) =>
      `나의 영혼과 가장 공명하는 인물은 【${celebName}】(일치율 ${rate}%)! 당신의 영혼 주파수는?`,

    // 8. 레일 사이드 바 버튼
    rail: {
      resonance: '공명',
      share: '공유',
      soundOn: '소리 켜짐',
      soundOff: '소리',
      settings: '설정',
    },

    // 9. 언어 토글 라벨
    langKr: 'KR',
    langJp: 'JP',
    langFullKr: '한국어',
    langFullJp: '日本語',
  },

  ja: {
    // 1. 앱 헤더 및 기본 정체성
    appTitle: 'CYBER-推命 // 魂の周波数',
    appSubtitle: 'LOCAL EDGE AI 四柱推命',
    appBrand: 'CYBER-推命 // LOCAL EDGE AI',

    // 2. 릴스 섹션 키커 / 타이틀 / 서브타이틀
    sections: {
      omen: {
        kicker: '今日の予兆',
        title: '天が送る\n今日の予兆',
        subtitle: '日辰と本元が交錯する一点を、一枚で読み解きます。',
        headerBadge: '天が送る今日の予兆',
      },
      life: {
        kicker: '人生 · 大運',
        title: '10年ごとに変わる\n人生の大波',
        subtitle: '今乗っている大運から、これから押し寄せる波まで。',
        headerBadge: '人生10年大運',
      },
      people: {
        kicker: '人間関係 · 胸中',
        title: '相手の胸中\nレーダー',
        subtitle: '大切な人の四柱に宿る桃花と別れの気を照合します。',
        headerBadge: '相手の胸中レーダー',
      },
      money: {
        kicker: '金運 · 潮流',
        title: '今日の金運エンジン\n財布の防衛線',
        subtitle: '呼び込む気と漏れ出る穴を、数字で可視化します。',
        headerBadge: '金運エンジンと防衛線',
      },
      celebrity: {
        kicker: '魂の共鳴',
        title: '魂が共鳴する\n有名人マッチング',
        subtitle: '日干と五行が重なる人物をローカルAIで選出します。',
        headerBadge: '魂の共鳴マトリクス',
      },
      mbti: {
        kicker: 'ペルソナ戦術室',
        title: '生まれ持った本質\nvs 社会的仮面',
        subtitle: '東洋の四柱五行と西洋のMBTIで読み解くエネルギー漏洩レポート',
        headerBadge: '生まれ持った本質 vs 社会的仮面',
      },
      circuit: {
        kicker: '五行カウンセリング',
        title: '先天五行DNA\n＆ 欠乏突破処方',
        subtitle: '生まれ持った最強の武器と最大の弱点を突き、現実の補強策を処方します。',
        headerBadge: '先天五行DNA ＆ 欠乏突破処方',
      },
      chamber: {
        kicker: 'チェンバー · 設定',
        title: '秘密の部屋\nチェンバー',
        subtitle: 'AI道士の口調とアプリの設定をここで調整します。',
        headerBadge: '秘密の部屋チェンバー',
      },
    },

    // 3. 주요 기능 및 버튼
    settle3Sec: '⚡ 1日3秒 五行決算',
    settleDesc: '今日巡り合った出来事や感情を3秒で五行に換算・決算します。',
    settleDoneBadge: '⚡ 本日の五行決算 完了',
    reSettleBtn: '🔄 再決算する',
    tomorrowStrategy: '明日の天機 ＆ 作戦設計',
    tomorrowDesc: '今日のエネルギー決算に基づき、明日の勝負手を設計します。',
    tomorrowDesignCta: '🎯 明日の作戦設計を始める',
    tomorrowComplete: '🔒 明日の作戦ブリーフィング 解禁',

    // 4. 5대 분야 카테고리
    categories: {
      wealth: '金運',
      love: '恋愛',
      career: '仕事',
      health: '健康',
      business: 'ビジネス',
    },

    // 5. 날짜 컨트롤
    today: '今日',
    prevDay: '前日',
    nextDay: '翌日',
    dateSelector: '日付変更',

    // 6. 소셜 공유 및 모달
    shareInsta: 'Instagram ストーリーに共有',
    shareTwitter: '𝕏で結果をポスト',
    postTwitter: '𝕏 ポスト',
    close: '閉じる',
    capturing: '📸 キャプチャ中...',

    // 7. Twitter 공유 템플릿
    twitterShareText: (celebName: string, rate: number) =>
      `私の魂と最も共鳴する人物は【${celebName}】(一致率 ${rate}%)！あなたの魂の周波数は？`,

    // 8. 레일 사이드 바 버튼
    rail: {
      resonance: '共鳴',
      share: '共有',
      soundOn: '音声ON',
      soundOff: '音声',
      settings: '設定',
    },

    // 9. 언어 토글 라벨
    langKr: 'KR',
    langJp: 'JP',
    langFullKr: '韓国語',
    langFullJp: '日本語',
  },
} as const;

export function t<K extends keyof (typeof DICTIONARY)['ko']>(
  key: K,
  overrideLocale?: Locale
): (typeof DICTIONARY)['ko'][K] {
  const loc = overrideLocale || activeLocale;
  const dict = (DICTIONARY[loc] || DICTIONARY.ko) as (typeof DICTIONARY)['ko'];
  return dict[key];
}

/** 𝕏 (Twitter) Web Intent URL 생성 및 오픈 */
export function openTwitterShare({
  celebName,
  rate,
  locale = activeLocale,
  appUrl,
}: {
  celebName: string;
  rate: number;
  locale?: Locale;
  appUrl?: string;
}): void {
  const shareText = DICTIONARY[locale].twitterShareText(celebName, rate);
  const targetUrl =
    appUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://cyber-saju.web.app');

  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(targetUrl)}&hashtags=${encodeURIComponent(
    'サイバー四柱推命,魂の共鳴,CYBERSAJU'
  )}`;

  if (typeof window !== 'undefined') {
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  } else {
    void Linking.openURL(intentUrl);
  }
}
