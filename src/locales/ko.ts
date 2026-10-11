import type { LocaleDictionary } from './types';

export const ko: LocaleDictionary = {
  appTitle: 'CYBER-SAJU // 영혼의 주파수',
  appSubtitle: 'LOCAL EDGE AI 四柱推命',
  appBrand: 'CYBER-SAJU // LOCAL EDGE AI',

  common: {
    header: {
      todayOmen: '하늘이 오늘 보내는 신호',
      solarDate: '양력',
      lunarDate: '음력',
    },
    dock: {
      share: '공유',
      soundOn: '소리 켜짐',
      soundOff: '소리',
      settings: '설정',
    },
    settings: {
      title: '사주 명식 설정',
      birth: '생년월일',
      time: '출생시간',
      gender: '성별',
      male: '남',
      female: '여',
      lang: '언어 설정',
      save: '저장하고 다시 계산',
    },
  },

  section01: {
    tab: '01 · 오늘의 징조',
    title: '하늘이 오늘\n보내는 신호',
    subtitle: '일진과 본원이 부딪히는 지점을 한 장으로 읽어요.',
    headerBadge: '오늘이 보내는 신호',
    ohaengNames: {
      Wood: '청목(나무)의 기운',
      Fire: '홍화(태양·열정)의 기운',
      Earth: '황토(대지·안정)의 기운',
      Metal: '백금(결단·쇠)의 기운',
      Water: '현수(지혜·바다)의 기운',
    },
    keyTitle: {
      比肩: '비견의 열쇠 (자립과 돌파)',
      劫財: '겁재의 열쇠 (승부와 결단)',
      食神: '식신의 열쇠 (여유와 생산)',
      傷官: '상관의 열쇠 (혁신과 직관)',
      偏財: '편재의 열쇠 (유통과 역동)',
      正財: '정재의 열쇠 (축적과 안정)',
      偏官: '편관의 열쇠 (개척과 결단)',
      正官: '정관의 열쇠 (원칙과 신용)',
      偏印: '편인의 열쇠 (심층과 지략)',
      印綬: '인수의 열쇠 (학문과 자산)',
      비견: '비견의 열쇠 (자립과 돌파)',
      겁재: '겁재의 열쇠 (승부와 결단)',
      식신: '식신의 열쇠 (여유와 생산)',
      상관: '상관의 열쇠 (혁신과 직관)',
      편재: '편재의 열쇠 (유통과 역동)',
      정재: '정재의 열쇠 (축적과 안정)',
      편관: '편관의 열쇠 (개척과 결단)',
      정관: '정관의 열쇠 (원칙과 신용)',
      편인: '편인의 열쇠 (심층과 지략)',
      인수: '인수의 열쇠 (학문과 자산)',
      정인: '정인의 열쇠 (학문과 자산)',
    },
    modalBtn: '신탁 전문 보기 ↗',
    chargeBtn: '✨ 오늘의 충전량 100% (오행 정산 완료)',
    settle3Sec: '⚡ 하루 3초 오행 정산',
    settleDesc: '오늘 마주친 사건과 감정을 3초 만에 오행으로 정산합니다.',
    settleDoneBadge: '⚡ 오늘의 오행 정산 완료',
    reSettleBtn: '🔄 다시 정산하기',
    items: {
      objectTitle: '개운 아이템 (오브제)',
      businessTitle: '비즈니스 행동 수칙 (룰북)',
      partnerTitle: '파트너십 보완 (인연)',
    },
  },

  section02: {
    tab: '06 · 페르소나 전술실',
    title: '선천 사주 코어\nvs 현실 가면',
    subtitle: '동양의 사주 오행과 서양의 MBTI로 풀어내는 나의 에너지 누수 리포트',
    headerBadge: '선천 사주 코어 vs 현실 가면',
    categories: {
      wealth: { label: '재물', icon: '💰' },
      love: { label: '사랑', icon: '❤️' },
      career: { label: '직업', icon: '💼' },
      health: { label: '건강', icon: '🌿' },
      business: { label: '비즈니스', icon: '🏢' },
    },
    innateTitle: '선천 사주 코어 (본성)',
    maskTitle: '현실 MBTI 가면 (페르소나)',
    innateBadge: '🔮 사주 원국 기반 본성',
    maskBadge: '🎭 사회적 생존 가면',
    tacticsTitle: '내일의 천기 & 작전 설계',
    tacticsSubtitle: '오늘 정산한 에너지를 기반으로 내일의 승부수를 설계합니다.',
    nightAuditTitle: '심야 결산 & 에너지 분석',
    mbtiInnate: {
      ENFJ: {
        summary: '사람을 이끌고 열정을 불태울 때 살아나는 카리스마 리더의 기질입니다.',
        element: '火木 기운의 온기와 돌파력',
      },
      INFJ: {
        summary: '깊은 직관과 통찰로 인간의 본질을 꿰뚫어보는 예언자의 기질입니다.',
        element: '水木 기운의 지혜와 이상',
      },
      ENTJ: {
        summary: '큰 그림을 설계하고 자원을 통솔하여 승리를 쟁취하는 지휘관의 기질입니다.',
        element: '金火 기운의 결단과 통솔',
      },
      INTJ: {
        summary: '냉철한 전략과 원칙으로 난관을 체계적으로 돌파하는 지략가의 기질입니다.',
        element: '金水 기운의 냉철함과 설계',
      },
      ENFP: {
        summary: '자유로운 영혼으로 새로운 영감을 전파하는 열정적 탐험가의 기질입니다.',
        element: '木火 기운의 활력과 확산',
      },
      INFP: {
        summary: '내면의 순수한 가치와 신념을 목숨처럼 지키는 이상주의자의 기질입니다.',
        element: '水木 기운의 감수성과 진정성',
      },
      ENTP: {
        summary: '고정관념을 부수고 판을 뒤흔드는 번뜩이는 혁신가의 기질입니다.',
        element: '火金 기운의 재치와 변혁',
      },
      INTP: {
        summary: '현상의 본질과 논리적 인과를 끝까지 파고드는 탐구자의 기질입니다.',
        element: '水金 기운의 분석과 사유',
      },
      ESFJ: {
        summary: '공동체의 조화와 사람들의 안녕을 세심하게 보살피는 조력자의 기질입니다.',
        element: '土火 기운의 포용과 헌신',
      },
      ISFJ: {
        summary: '변함없는 성실함으로 자신의 자리를 묵묵히 지키는 수호자의 기질입니다.',
        element: '土金 기운의 신뢰와 인내',
      },
      ESTJ: {
        summary: '엄격한 규율과 실행력으로 조직을 굳건히 경영하는 관리자의 기질입니다.',
        element: '金土 기운의 질서와 통제',
      },
      ISTJ: {
        summary: '원칙과 신의를 바탕으로 한 번 맡은 책임을 완벽히 수행하는 성실함의 기질입니다.',
        element: '金土 기운의 정직과 완수',
      },
      ESFP: {
        summary: '순간의 생명력을 만끽하며 주변을 환하게 밝히는 무대 위 연예인의 기질입니다.',
        element: '火土 기운의 유쾌함과 매력',
      },
      ISFP: {
        summary: '자연과 예술을 사랑하며 조용히 자신만의 아름다움을 빚어내는 예술가의 기질입니다.',
        element: '木土 기운의 온화함과 심미안',
      },
      ESTP: {
        summary: '위기를 기회로 바꾸며 현장을 거침없이 휘어잡는 야전 사령관의 기질입니다.',
        element: '金火 기운의 순발력과 승부욕',
      },
      ISTP: {
        summary: '군더더기 없이 문제를 즉각 해결하는 고독한 장인의 기질입니다.',
        element: '金水 기운의 실용과 민첩',
      },
    },
    mbtiMask: {
      ENFJ: {
        summary: '모두의 기대를 저버리지 않으려 완벽한 지도자를 연기하는 페르소나입니다.',
        mask: '완벽한 지도자의 가면',
      },
      INFJ: {
        summary: '상처받지 않기 위해 온화한 미소 뒤에 깊은 속마음을 감추는 가면입니다.',
        mask: '초연한 관찰자의 가면',
      },
      ENTJ: {
        summary: '약점을 보이지 않기 위해 냉혹한 효율만을 앞세우는 가면입니다.',
        mask: '철혈 군주의 가면',
      },
      INTJ: {
        summary: '감정 소모를 피하기 위해 차가운 분석의 벽을 세우는 가면입니다.',
        mask: '냉철한 분석가의 가면',
      },
      ENFP: {
        summary: '외로움과 번아웃을 감추기 위해 항상 밝고 긍정적인 척하는 가면입니다.',
        mask: '밝은 광대의 가면',
      },
      INFP: {
        summary: '현실의 거친 갈등을 피하기 위해 조용한 무해함을 가장하는 가면입니다.',
        mask: '조용한 평화주의자의 가면',
      },
      ENTP: {
        summary: '진지함을 숨기고 유쾌한 농담과 재치 있는 언변 뒤에 숨는 가면입니다.',
        mask: '유쾌한 재담꾼의 가면',
      },
      INTP: {
        summary: '불필요한 감정 교류를 피하고 차분한 관찰자로 남으려는 거리두기 가면입니다.',
        mask: '합리적 무관심의 가면',
      },
      ESFJ: {
        summary: '모든 사람에게 좋은 사람이어야 한다는 배려와 미소의 사회적 가면입니다.',
        mask: '친절한 미소의 가면',
      },
      ISFJ: {
        summary: '거절하지 못하고 묵묵히 궂은일을 떠맡는 희생과 배려의 가면입니다.',
        mask: '묵묵한 수용의 가면',
      },
      ESTJ: {
        summary: '감정에 휘둘리지 않고 엄격한 기준을 적용해야 한다는 관리자의 가면입니다.',
        mask: '철저한 규율의 가면',
      },
      ISTJ: {
        summary: '실수하지 않기 위해 규칙과 매뉴얼 뒤에 철저히 숨는 신중함의 가면입니다.',
        mask: '신중한 파수꾼의 가면',
      },
      ESFP: {
        summary: '우울함을 드러내지 않고 항상 분위기를 띄워야 한다는 광대의 가면입니다.',
        mask: '흥겨운 분위기메이커의 가면',
      },
      ISFP: {
        summary: '마찰을 일으키지 않기 위해 상대에게 무조건 맞춰주는 순응의 가면입니다.',
        mask: '조용한 양보의 가면',
      },
      ESTP: {
        summary: '두려움을 숨기고 언제나 자신만만한 척 돌진하는 전사의 가면입니다.',
        mask: '자신만만한 승부사의 가면',
      },
      ISTP: {
        summary: '타인과의 깊은 관계를 피하고 쿨한 척 선을 긋는 독립의 가면입니다.',
        mask: '쿨한 독립성의 가면',
      },
    },
  },

  section03: {
    pillars: {
      year: '연주 (年柱 · 근본과 가문)',
      month: '월주 (月柱 · 환경과 직업)',
      day: '일주 (日柱 · 본원과 자신)',
      time: '시주 (時柱 · 결실과 미래)',
    },
    elements: {
      stem: '천간 (天干)',
      branch: '지지 (地支)',
      tenGod: '통변성 (십신)',
      twelveFortune: '십이운성 (十二運)',
    },
    distribution: {
      title: '선천 오행 원국 에너지 분포',
      wood: '목(木 · 기획·돌파)',
      fire: '화(火 · 열정·마케팅)',
      earth: '토(土 · 안정·신뢰)',
      metal: '금(金 · 결단·수확)',
      water: '수(水 · 유연·지략)',
      dominant: '타고난 최강의 무기 (과다 오행)',
      deficient: '치명적인 아킬레스건 (결핍 오행)',
    },
  },

  section04: {
    tab: '04 · 돈 · 흐름',
    title: '오늘의 돈 버는 엔진 & 지갑 방어선',
    subtitle: '벌리는 기운과 새는 구멍을 실시간 네온 게이지로 스캔합니다.',
    auraBadge: (god: string, ohaeng: string) => `오늘의 금전 기운: ${god} × ${ohaeng}`,
    modeBadge: '자립 방어 모드',
    inflow: '유입 엔진 (버는 힘)',
    leak: '누수 경보 (새는 구멍)',
    insightTitle: '사주 팩트 기반 금전 통찰',
    doTitle: '추천 액션 (DO)',
    dontTitle: '절대 금지 (DON\'T)',
    deepBtn: '돈 버는 엔진 심층 분석 보기 ➔',
    modal: {
      kicker: '전략적 금융 비책 해단',
      title: '오늘의 금전 흐름 심층 진단',
      close: '닫기',
    },
    tenGods: {
      정재: {
        godHanja: '正財',
        inflowPower: 88,
        inflowLabel: '계약 성사력 88% · 정기 매출 우세',
        outflowRisk: 24,
        outflowLabel: '지출 누수 24% · 알뜰 방어 우수',
        modeBadge: '흑자 수성 모드',
        headline: '정재(正財)의 안정성: 성실한 땀방울이 온전한 결실로 채워지는 날',
        baseInsight:
          '정재(正財)의 기운이 들어와 정직하게 일한 대가와 정기적인 매출이 고스란히 곳간으로 쌓이는 날이다. 무리하게 한 방을 노리기보다 이미 성사된 거래처의 미수금을 칼같이 회수하고 고정 마진율을 지키는 데 집중하라. 오늘 들어온 돈은 오래도록 네 터전을 든든하게 지켜줄 소중한 종잣돈이 된다.',
        actionDo: '기존 거래처 잔금 정산, 고정 마진율 점검, 정기 적금·안전자산 예치',
        actionDont: '고수익 미끼 상품 투자, 불필요한 체면치레 지출, 검증 안 된 외상 거래',
      },
      편재: {
        godHanja: '偏財',
        inflowPower: 84,
        inflowLabel: '매출 회전력 84% · 기회 포착 우세',
        outflowRisk: 58,
        outflowLabel: '돌발 손실 58% · 단기 변동성 주의보',
        modeBadge: '공격적 계약 모드',
        headline: '편재(偏財)의 역동성: 큰 판을 흔들고 주도권을 쥐어야 하는 날',
        baseInsight:
          '편재(偏財)의 기운이 요동치며 판세가 크게 움직이는 날이다. 가만히 앉아 기다리기보다 먼저 연락하고 협상 테이블을 주도할 때 예상치 못한 큰 이익을 쥘 수 있다. 단, 눈앞의 이익에 눈이 멀면 예상치 못한 복병을 만나니 계약서의 독소 조항과 위약금 기준을 매의 눈으로 감시하라.',
        actionDo: '적극적인 신규 제안·미팅, 단가 상향 협상, 신규 유통 채널 확보',
        actionDont: '과도한 레버리지 몰빵, 충동적 주식·코인 추격 매수, 즉흥적 호언장담',
      },
      식신: {
        godHanja: '食神',
        inflowPower: 78,
        inflowLabel: '생산 창출력 78% · 전문성 결실 우세',
        outflowRisk: 36,
        outflowLabel: '기분파 소비 36% · 미세 누수 경보',
        modeBadge: '생산 집중 모드',
        headline: '식신(食神)의 생산력: 손끝의 재주와 기획이 황금으로 바뀌는 날',
        baseInsight:
          '식신(食神)은 네 재주와 전문성이 곧장 황금으로 치환되는 복록의 기운이다. 만들고 기획한 작업물을 자신 있게 세상에 공개하라. 고객의 지갑을 여는 것은 네 진정성 있는 결과물이다. 다만 성취감에 취해 주변 사람들에게 기분파로 한턱 쏘거나 밥값을 몰아내다가는 실속이 샐 수 있다.',
        actionDo: '핵심 작업물 공개·홍보, 상품 단가 현실화, 기술·콘텐츠 판매',
        actionDont: '기분파 식사 대접 및 골든벨, 무계획 장비 충동 구매, 무료 재능 기부',
      },
      상관: {
        godHanja: '傷官',
        inflowPower: 72,
        inflowLabel: '틈새 돌파력 72% · 파격 아이디어 우세',
        outflowRisk: 64,
        outflowLabel: '위약금 리스크 64% · 언행 주의보',
        modeBadge: '전략적 검토 모드',
        headline: '상관(傷官)의 틈새 공략: 직관은 뛰어나나 말실수가 돈을 깎는 날',
        baseInsight:
          '상관(傷官)의 번뜩이는 통찰로 기존의 낡은 관행을 깨고 틈새 수익을 창출할 수 있는 날이다. 허나 날 선 화법이나 직설적인 요구가 거래처의 심기를 건드려 다 된 밥에 재를 뿌릴 수 있다. 협상장에서는 미소를 띠고 말을 아끼며, 계약 조항은 현미경으로 검토하라.',
        actionDo: '틈새 시장 기획안 작성, 기존 비용 절감안 수립, 서류 세부 조항 점검',
        actionDont: '협상 중 감정적 반박, 비밀 유지 의무 위반 발설, 즉흥적 도장 날인',
      },
      정관: {
        godHanja: '正官',
        inflowPower: 74,
        inflowLabel: '신용 가치 74% · 공신력 기반 계약 우세',
        outflowRisk: 28,
        outflowLabel: '손실 리스크 28% · 규정 준수 철통 방어',
        modeBadge: '흑자 수성 모드',
        headline: '정관(正官)의 신용: 반듯한 명분과 규정이 최고의 이익을 낳는 날',
        baseInsight:
          '정관(正官)의 엄정한 질서가 네 신용을 황금 갑옷으로 만들어주는 날이다. 공공 기관, 기업, 원청과의 계약이나 심사에서 네 성실함과 투명한 기록이 가장 강력한 무기가 된다. 편법이나 지름길을 탐하지 말고 정석대로 절차를 밟을 때 가장 안전하고 확실한 수익이 보장된다.',
        actionDo: '공식 제안서 제출, 세금·영수증 철저 정산, 원칙 중심의 계약 협의',
        actionDont: '이면 계약 합의, 편법 세금 감면 유혹, 구두 약속만 믿는 방심',
      },
      편관: {
        godHanja: '偏官',
        inflowPower: 48,
        inflowLabel: '돌파 압박 48% · 보수적 수성 급선무',
        outflowRisk: 76,
        outflowLabel: '돌발 청구 76% · 갑작스런 지출 경보',
        modeBadge: '지갑 봉인 모드',
        headline: '편관(偏官)의 압박: 갑작스러운 청구서와 지출 요구를 버텨내야 하는 날',
        baseInsight:
          '칠살(七殺)로도 불리는 편관의 거센 압박이 들어오는 날이다. 거래처의 무리한 단가 인하나 갑작스러운 수리비, 세금 등 예상치 못한 청구서가 날아들 수 있다. 지금은 판을 벌릴 때가 아니라 네 진지를 사수하고 현금을 꽉 쥐고 버텨내야 다음 판의 주도권을 쥘 수 있다.',
        actionDo: '긴급 비상금 확보, 불필요한 외주 계약 일시 정지, 채무 상환 일정 점검',
        actionDont: '신규 대출 실행, 타인을 위한 연대 보증, 압박에 못 이긴 헐값 계약',
      },
      비견: {
        godHanja: '比肩',
        inflowPower: 58,
        inflowLabel: '독립 생산력 58% · 개인 역량 성과',
        outflowRisk: 52,
        outflowLabel: '체면 소비 52% · 동료 분할 지출 주의',
        modeBadge: '자립 방어 모드',
        headline: '비견(比肩)의 자립: 홀로서기로 번 돈을 남의 눈치로 날리지 말 것',
        baseInsight:
          '비견(比肩)의 꼿꼿한 기운이 들어와 남에게 기대지 않고 스스로 일군 성과가 보람을 주는 날이다. 다만 동료나 경쟁자와 엮이며 자존심 싸움으로 비화하거나, 뒤처지지 않으려 무리하게 지갑을 열어 돈을 낭비할 수 있다. 남과 비교하지 말고 네 속도대로 곳간을 채워라.',
        actionDo: '단독 진행 프로젝트 집중, 개인 통장 잔고 분리, 내 몫의 권리 명확화',
        actionDont: '동업 지분 맹신, 남 따라 사는 과시성 소비, 무리한 공동 분담금 지출',
      },
      겁재: {
        godHanja: '劫財',
        inflowPower: 32,
        inflowLabel: '수익 기회 32% · 내 곳간 사수 초비상',
        outflowRisk: 88,
        outflowLabel: '손재수(損財數) 88% · 최고조 경보 발령',
        modeBadge: '지갑 봉인 모드',
        headline: '겁재(劫財)의 경고: 남의 입놀림과 투자 꾐에 지갑이 통째로 털리는 날',
        baseInsight:
          '겁재(劫財)는 재물을 겁탈하려는 도둑의 기운이니 오늘만큼은 지갑에 굵은 자물쇠를 채워야 한다. 달콤한 투자 제안, 지인의 눈물 섞인 부탁, 동업 제안은 전부 네 곳간을 털어가려는 손재수의 덫이다. 오늘은 1원도 남에게 빌려주지 말고 어떤 계약서에도 도장을 찍지 마라.',
        actionDo: '카드 한도 일시 하향, 계좌 이체 전 3회 숙고, 동업 자금 제안 거절',
        actionDont: '지인 금전 대여, 주식·코인 신규 매수, 섣부른 공동 투자 송금',
      },
      정인: {
        godHanja: '正印',
        inflowPower: 68,
        inflowLabel: '문서 가치 68% · 지적 자산 가치 상승',
        outflowRisk: 34,
        outflowLabel: '지출 통제 34% · 낭비 차단 우수',
        modeBadge: '흑자 수성 모드',
        headline: '정인(正印)의 지혜: 문서와 지식 자산이 장기적인 부를 부르는 날',
        baseInsight:
          '정인(正印)의 맑은 문서운이 들어와 자격증, 라이선스, 기획서 등 지적 자산이 장기적인 부의 마중물이 되는 날이다. 단기적인 푼돈에 일희일비하지 말고 네 가치를 증명할 공식 문서와 계약을 매듭지어라. 귀인의 조언을 경청하되 배움에 과도하게 충동 결제하는 것은 삼가라.',
        actionDo: '특허·저작권·계약서 검토, 전문가 자문 청취, 장기 포트폴리오 리밸런싱',
        actionDont: '충동적인 고액 강의 결제, 증빙 없는 구두 합의, 지나치게 수동적인 안주',
      },
      편인: {
        godHanja: '偏印',
        inflowPower: 52,
        inflowLabel: '특수 전문성 52% · 틈새 기술 발휘',
        outflowRisk: 60,
        outflowLabel: '잡념 지출 60% · 헛돈 낭비 주의보',
        modeBadge: '전략적 검토 모드',
        headline: '편인(偏印)의 통찰: 남들이 못 보는 금맥을 보되 뜬구름을 잡지 말 것',
        baseInsight:
          '편인(偏印)의 날카로운 직관이 남들이 보지 못하는 틈새 시장을 포착하게 해준다. 허나 의구심과 잡념이 꼬리를 물어 결정을 번복하다가 타이밍을 놓치거나 비현실적인 환상에 헛돈을 쓸 수 있다. 냉철한 수치로 검증된 곳에만 집중하고 고립된 독단을 경계하라.',
        actionDo: '숨은 비효율 지출 정리, 쓰지 않는 정기 결제 해지, 특수 기술 역량 강화',
        actionDont: '비상장·기획 부동산 솔깃, 불확실한 투기성 베팅, 현실 도피성 충동 소비',
      },
    },
  },

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

  categories: {
    wealth: '재물',
    love: '사랑',
    career: '직업',
    health: '건강',
    business: '비즈니스',
  },

  today: '오늘',
  prevDay: '이전 날',
  nextDay: '다음 날',
  dateSelector: '날짜 변경',

  shareInsta: '인스타 스토리에 공유하기',
  shareTwitter: '𝕏에 결과 공유하기',
  postTwitter: '𝕏 포스트하기',
  close: '닫기',
  capturing: '📸 스토리 캡처 중...',

  twitterShareText: (celebName: string, rate: number) =>
    `나의 영혼과 가장 공명하는 인물은 【${celebName}】(일치율 ${rate}%)! 당신의 영혼 주파수는?`,

  rail: {
    share: '공유',
    soundOn: '소리 켜짐',
    soundOff: '소리',
    settings: '설정',
  },

  langKr: 'KR',
  langJp: 'JP',
  langFullKr: '한국어',
  langFullJp: '日本語',
};
