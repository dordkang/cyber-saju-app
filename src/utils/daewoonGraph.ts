export interface DaewoonStep {
  ageStart: number;
  ageEnd: number;
  ganji: string;      // 예: "丁丑"
  stemGod: string;    // 예: "정재"
  branchGod: string;  // 예: "겁재"
  wealthScore: number; // 0 ~ 100 (재물 흐름 지수)
  isCurrent: boolean;  // 현재 활성 대운 여부
  advice: {
    kr: string;
    jp: string;
  };
}

// 사용자 사주와 만 나이 기반 8개 대운 구간 생성
export function calculateDaewoonTimeline(
  userProfile?: any,
  currentAge: number = 51,
  _lang: 'kr' | 'jp' = 'kr'
): DaewoonStep[] {
  // 기준 사용자(1975년생, 대운수 6) 기준 및 일반화 로직
  const baseNum = userProfile?.daewoonNum || 6;

  // 만 나이 동적 계산 (birthDate 존재 시)
  let effectiveAge = currentAge;
  if (userProfile?.birthDate) {
    const bYear = parseInt(String(userProfile.birthDate).slice(0, 4), 10);
    if (!isNaN(bYear) && bYear > 1900) {
      effectiveAge = new Date().getFullYear() - bYear;
    }
  }

  const sampleGanjis = [
    { ganji: "戊寅", stem: "편관", branch: "비견", score: 45, kr: "기반을 닦고 터전을 잡는 시기", jp: "基盤を築き拠点を固める時期" },
    { ganji: "己卯", stem: "정관", branch: "겁재", score: 55, kr: "세상과 부딪치며 이름을 알리는 시기", jp: "世に出て名を広げる時期" },
    { ganji: "庚辰", stem: "편인", branch: "식신", score: 70, kr: "기술과 내공을 축적하는 담금질", jp: "技術と内功を蓄積する鍛錬期" },
    { ganji: "辛巳", stem: "정인", branch: "상관", score: 85, kr: "칼날을 벼려 독자적 전성기를 여는 운", jp: "刃を研ぎ澄まし独自の全盛期を開く運" },
    { ganji: "壬午", stem: "비견", branch: "편재", score: 65, kr: "판을 키우며 현금 유동성을 방어할 때", jp: "勝負に出てキャッシュフローを防衛する時" },
    { ganji: "癸未", stem: "겁재", branch: "정재", score: 60, kr: "동업과 주변 누수를 틀어막아야 할 고비", jp: "共同事業と資金漏れを封じるべき関門" },
    { ganji: "甲申", stem: "식신", branch: "편관", score: 90, kr: "지지 금고가 열리고 막대한 결실을 거두는 황금기", jp: "地支の金庫が開き莫大な実りを手にする黄金期" },
    { ganji: "乙酉", stem: "상관", branch: "정관", score: 80, kr: "명예를 지키고 시스템으로 다스리는 원로기", jp: "名誉を守りシステムで治める円熟期" }
  ];

  let hasCurrent = false;
  const list = sampleGanjis.map((item, idx) => {
    const ageStart = baseNum + (idx * 10);
    const ageEnd = ageStart + 9;
    const isCurrent = effectiveAge >= ageStart && effectiveAge <= ageEnd;
    if (isCurrent) hasCurrent = true;
    return {
      ageStart,
      ageEnd,
      ganji: item.ganji,
      stemGod: item.stem,
      branchGod: item.branch,
      wealthScore: item.score,
      isCurrent,
      advice: { kr: item.kr, jp: item.jp }
    };
  });

  // 범위 밖일 경우 기본 46~55세(壬午 대운) 또는 가장 가까운 대운 활성화
  if (!hasCurrent && list.length > 0) {
    const defaultIdx = list.findIndex(s => s.ganji === "壬午");
    if (defaultIdx !== -1) {
      list[defaultIdx].isCurrent = true;
    } else {
      list[0].isCurrent = true;
    }
  }

  return list;
}
