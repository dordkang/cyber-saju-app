import { calculateSaju } from './calculator';
import { getTenGod } from './timelineEngine';
import type { EarthlyBranch, FiveElement, HeavenlyStem, SajuResult } from './types';

export interface TomorrowOmen {
  dateLabel: string;
  ganji: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  element: FiveElement;
  elementTitle: string;
  godName: string;
  shinsal: {
    name: string;
    description: string;
    isFeatured: boolean;
  };
}

const ELEMENT_TITLE_MAP: Record<FiveElement, string> = {
  Wood: '청목(靑木)의 기운',
  Fire: '적화(赤火)의 기운',
  Earth: '황토(黃土)의 기운',
  Metal: '백금(白金)의 기운',
  Water: '흑수(黑水)의 기운',
};

const BRANCH_SHINSAL_MAP: Record<string, { dohwa: EarthlyBranch; yeokma: EarthlyBranch; hwagae: EarthlyBranch }> = {
  寅午戌: { dohwa: '卯', yeokma: '申', hwagae: '戌' },
  申子辰: { dohwa: '酉', yeokma: '寅', hwagae: '辰' },
  巳酉丑: { dohwa: '午', yeokma: '亥', hwagae: '丑' },
  亥卯未: { dohwa: '子', yeokma: '巳', hwagae: '未' },
};

const BAEKHO_LIST = new Set(['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑']);

/** 내일의 일진 및 신살 계산 */
export function getTomorrowOmen(saju: SajuResult | null, baseDate: Date = new Date()): TomorrowOmen {
  const tomorrow = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 12, 0);
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const weekDay = ['일', '월', '화', '수', '목', '금', '토'][tomorrow.getDay()] ?? '';
  const dateLabel = `${tomorrow.getFullYear()}.${mm}.${dd} (${weekDay})`;

  const tomorrowSaju = calculateSaju(
    tomorrow.getFullYear(),
    tomorrow.getMonth() + 1,
    tomorrow.getDate(),
    12,
    0,
    true
  );
  const dayPillar = tomorrowSaju.pillars.day;
  const stem = dayPillar.stem;
  const branch = dayPillar.branch;
  const ganji = `${stem}${branch}`;
  const element = dayPillar.elements[0];
  const elementTitle = ELEMENT_TITLE_MAP[element] ?? '적화(赤火)의 기운';

  let godName = '비견';
  if (saju?.dayMaster) {
    godName = getTenGod(saju.dayMaster, stem);
  }

  // 신살 판별: 사용자 일지(또는 년지) 기준 삼합 그룹
  const userDayBranch = saju?.pillars.day.branch ?? '辰';
  let shinsalName = '도화살(桃花殺)';
  let shinsalDesc = '사람을 끌어당기고 매력이 분출하는 기운';

  // 백호살 체크
  if (BAEKHO_LIST.has(ganji)) {
    shinsalName = '백호살(白虎殺)';
    shinsalDesc = '칼날 같은 서릿발과 피 튀기는 결단력의 기운';
  } else {
    // 삼합 도화/역마/화개 체크
    for (const [group, val] of Object.entries(BRANCH_SHINSAL_MAP)) {
      if (group.includes(userDayBranch)) {
        if (branch === val.dohwa) {
          shinsalName = '도화살(桃花殺)';
          shinsalDesc = '시선과 심장을 뒤흔드는 붉은 복사꽃 기운';
        } else if (branch === val.yeokma) {
          shinsalName = '역마살(驛馬殺)';
          shinsalDesc = '판을 뒤흔들고 길을 떠나는 질주의 기운';
        } else if (branch === val.hwagae) {
          shinsalName = '화개살(華蓋殺)';
          shinsalDesc = '예술과 사색, 숨겨둔 비장의 칼을 갈아내는 기운';
        }
        break;
      }
    }
  }

  return {
    dateLabel,
    ganji,
    stem,
    branch,
    element,
    elementTitle,
    godName,
    shinsal: {
      name: shinsalName,
      description: shinsalDesc,
      isFeatured: true,
    },
  };
}

/** 사용자의 스케줄과 내일의 사주 기운을 결합한 무당 지문 톤 맞춤 작전 해단 */
export function generateTomorrowStrategy(plan: string, omen: TomorrowOmen): string {
  const p = plan.trim();
  const lower = p.toLowerCase();

  // 1. 데이트 / 영화 / 연애 / 썸
  if (/데이트|영화|여친|남친|연애|소개팅|사랑|고백|썸|만남/.test(lower)) {
    return `(눈을 찡긋하며 귀에 대고 속삭이듯) "내일은 ${omen.ganji}의 날, ${omen.elementTitle}과 ${omen.shinsal.name}이 피어오르는 날이다! 피 튀기는 액션영화 대신 심장 쿵쾅거리는 로맨스나 야경을 골라라. 어물쩍 눈치 보지 말고 손 먼저 덥석 잡는 놈이 내일 밤 판을 쥔다!"`;
  }

  // 2. 미팅 / 투자 / 사업 / 거래처 / 계약 / 담판
  if (/미팅|투자|사업|거래처|계약|담판|협상|돈|프레젠테이션|pt|발표/.test(lower)) {
    return `(탁자를 단호하게 짚으며 서슬 퍼런 눈으로) "내일은 ${omen.ganji}의 서릿발 기운이다! 어설픈 감정이나 사정 봐주기는 집어치워라. 오직 냉정한 숫자와 문서로만 들이밀어라. 입을 무겁게 닫고 상대가 먼저 패를 까게 만들면 도장은 네 손에 쥐어진다!"`;
  }

  // 3. 이동 / 출장 / 여행 / 운동 / 운전
  if (/출장|이동|여행|비행기|기차|드라이브|운동|이사/.test(lower)) {
    return `(부채를 촥 펼치며 호탕하게) "내일은 ${omen.shinsal.name}의 바람이 사방으로 휘몰아친다! 자리에 웅크리지 말고 발걸음을 크게 떼어라. 길 위에서 뜻밖의 귀인을 마주치거나 막힌 자금줄의 힌트를 낚아챌 천재일우의 기회다!"`;
  }

  // 4. 시험 / 공부 / 면접 / 자격증
  if (/시험|면접|공부|자격증|합격|테스트|검사/.test(lower)) {
    return `(어깨를 묵직하게 다독이며 기운을 불어넣듯) "쫄지 마라! 내일 정수리에 벼락같은 귀인의 기운이 꽂힌다. 쓸데없는 잔재주 부리지 말고, 평소 갈고닦은 네 내공을 우직하게 쏟아부어라. 기죽지 않는 자가 문을 뚫는다!"`;
  }

  // 5. 휴식 / 술 / 힐링 / 잠
  if (/휴식|잠|힐링|술|약속|친구|밥/.test(lower)) {
    return `(부채로 무릎을 탁 치며) "피로와 잡념이 독이 되는 날이니, 쓸데없는 잔정에 휘둘리지 마라! 술자리는 일찍 파하고 네 기운을 보존해라. 내일 하루 푹 쉬어 기운을 완충해야 주말에 큰 판이 열린다!"`;
  }

  // 6. 기본(사용자가 자유 텍스트를 입력했을 때)
  if (p.length > 0) {
    return `(상대의 손등을 꽉 쥐며 서슬 퍼렇게) "네가 내일 '${p}'(으)로 승부를 보려 하는구나! 내일은 ${omen.ganji}의 ${omen.elementTitle}이 요동치는 날이다. 딴 놈들 말에 흔들리지 말고 네 직관의 칼날 하나만 믿고 밀어붙여라. 하늘이 네 등 뒤를 받치고 있다!"`;
  }

  return `(손끝으로 점괘를 짚으며) "내일은 ${omen.ganji}의 날, ${omen.shinsal.name}이 흐르는 변곡점이다. 계획을 세워 네 칼을 벼려라. 준비된 자만이 하늘의 재물을 움켜쥔다!"`;
}

/** 3초 오행 정산 후 메인 카드 [오늘의 열쇠]에 반영될 맞춤 해단 */
export function generateTodayCustomAdvice(
  emotion: string,
  event: string,
  memo?: string
): { keyword: string; fortuneText: string } {
  const m = memo?.trim();
  const memoSnippet = m ? `'${m}'` : `'${event}'`;

  const keyword = `${emotion}화(化)의 정산`;
  const fortuneText = `(탁자를 탕 내리치며 서슬 퍼런 눈으로) "네가 오늘 ${memoSnippet} 일로 가슴에 ${emotion}의 불길이 일렁였구나! 억울함과 고단함을 삼키며 여기까지 버틴 네 독기를 내가 안다. 오늘 배터리를 100% 채웠으니 지난 액운은 다 불태워졌다. 빗장을 걸어 잠그고 내일의 칼날을 갈아라!"`;

  return {
    keyword,
    fortuneText,
  };
}
