import React, { memo, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playHaptic } from '../reels/haptics';
import type { FiveElement, SajuResult } from '../../engine/types';
import { useLocale } from '../../locales';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

const LUXURY_GLASS = (
  IS_WEB
    ? {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      }
    : null
) as unknown as ViewStyle | null;

const GOLD_CTA_SHADOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 24px rgba(255, 184, 0, 0.4)',
        transition: 'all 0.25s ease',
      }
    : null
) as unknown as ViewStyle | null;

const ELEMENT_ORDER: readonly FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

interface ElementCounseling {
  element: FiveElement;
  name: string;
  hanja: string;
  shortConcept: string;
  icon: string;
  color: string;
  glow: string;
  dominantBadge: string;
  dominantHeadline: string;
  dominantCounseling: string;
  deficientBadge: string;
  deficientHeadline: string;
  deficientCounseling: string;
  solObject: string;
  solBusiness: string;
  solPartner: string;
}

const ELEMENT_COUNSELING_MAP: Record<FiveElement, ElementCounseling> = {
  Metal: {
    element: 'Metal',
    name: '금(金)',
    hanja: '金',
    shortConcept: '결단·수확',
    icon: '🗡️',
    color: '#E2E8F0',
    glow: 'rgba(226, 232, 240, 0.75)',
    dominantBadge: '압도적 엔진 · 냉철한 칼날 DNA',
    dominantHeadline: '군더더기를 베어내는 서슬 퍼런 쇠(金)',
    dominantCounseling:
      '사주의 기운 중 쇠와 칼날(金)의 비중이 가장 높습니다. 복잡한 문제를 단숨에 정리하고 냉철하게 결단을 내리며 마진을 지켜내는 날카로운 통찰과 원칙주의가 당신의 천재성입니다. 가치 없는 것을 쳐내고 진짜 알짜배기만 남기는 개혁가의 숙명을 타고났습니다.',
    deficientBadge: '취약점 경보 · 결단의 부재',
    deficientHeadline: '거절하지 못하고 가지치기에 실패하는 위험',
    deficientCounseling:
      '사주에 쇠와 칼날(金)의 기운이 0%로 완전히 비어 있습니다. 판은 기가 막히게 벌려놓고 마지막에 냉정하게 거절하지 못해 손해를 보거나, 정에 이끌려 수금과 단가 협상에서 물러터지기 쉬운 아킬레스건이 있습니다. 가지치기를 못 해 벌려놓은 일에 스스로 질식할 위험을 주의해야 합니다.',
    solObject: '은빛 메탈 체인, 묵직한 금속 볼펜, 흰색/은색 계열 소품 착용으로 흩어진 기운을 조여주기.',
    solBusiness: '계약서 날인 전 반드시 24시간 냉각기 갖기, 거절하기 힘든 부탁은 "회사 내규상 어렵다"며 시스템 뒤로 숨기.',
    solPartner: '나와 반대로 사주에 쇠(金) 기운이 단단한 냉철한 참모나 파트너에게 마지막 검수와 계약 마무리를 전담시키기.',
  },
  Wood: {
    element: 'Wood',
    name: '목(木)',
    hanja: '木',
    shortConcept: '기획·돌파',
    icon: '🌲',
    color: '#00FF9D',
    glow: 'rgba(0, 255, 157, 0.75)',
    dominantBadge: '압도적 엔진 · 개척자 DNA',
    dominantHeadline: '폭발적인 기획력과 실행력의 나무(木)',
    dominantCounseling:
      '사주의 절반이 거대한 나무(木)로 이루어져 있습니다. 남들이 계산기 두드리며 망설일 때, 이미 현장에 나가 판을 깔고 공장을 돌리는 폭발적인 기획력과 실행력이 당신의 천재성입니다. 무에서 유를 만들어내는 개척자의 숙명을 타고났습니다.',
    deficientBadge: '취약점 경보 · 시작의 두려움',
    deficientHeadline: '첫 발을 떼지 못하고 망설이는 위험',
    deficientCounseling:
      '사주에 나무와 새싹(木)의 기운이 비어 있습니다. 머릿속으로는 완벽한 계획을 세워두고도 첫 발을 떼는 것을 망설이거나, 실패에 대한 두려움으로 시작 시기를 놓치기 쉬운 아킬레스건이 있습니다. 유연성과 생명력을 의식적으로 보충해야 합니다.',
    solObject: '원목 소품, 녹색 계열 패션 포인트, 책상 위 싱싱한 생화나 관엽식물 두기.',
    solBusiness: '완벽을 기다리지 말고 60% 완성도에서 일단 론칭하기, 첫 5분 즉각 실행 룰 적용하기.',
    solPartner: '저돌적으로 일을 저지르고 판을 벌리는 목(木) 기운 강한 개척자형 동료와 협업하기.',
  },
  Fire: {
    element: 'Fire',
    name: '화(火)',
    hanja: '火',
    shortConcept: '열정·마케팅',
    icon: '🔥',
    color: '#FF3366',
    glow: 'rgba(255, 51, 102, 0.75)',
    dominantBadge: '압도적 엔진 · 열정의 비전가 DNA',
    dominantHeadline: '세상을 물들이는 태양의 불꽃(火)',
    dominantCounseling:
      '사주의 기운 중 타오르는 불(火)의 비중이 가장 높습니다. 주변 사람들의 마음에 불을 지피고 단숨에 이목을 집중시키는 압도적인 카리스마와 표현력이 당신의 천재성입니다. 어둠 속에서도 스스로 빛을 밝혀 대중을 이끄는 선구자의 숙명을 타고났습니다.',
    deficientBadge: '취약점 경보 · 표현의 위축',
    deficientHeadline: '실력을 알아주지 않아 묻히는 위험',
    deficientCounseling:
      '사주에 불과 빛(火)의 기운이 비어 있습니다. 실력과 전문성은 충분하나 자신을 드러내고 마케팅하는 것을 쑥스러워하여 본인의 가치를 제대로 인정받지 못하는 아킬레스건이 있습니다. 가만히 있으면 아무도 알아주지 않는 현실의 벽에 부딪힐 수 있습니다.',
    solObject: '붉은색/와인색 포인트 액세서리, 조도가 밝은 조명 스탠드 사용, 따뜻한 차 마시기.',
    solBusiness: '매주 1회 내 성과와 비전을 적극적으로 알리는 피칭 루틴 만들기, 감정 표현을 20% 과장해 전달하기.',
    solPartner: '대중 앞에서 능숙하게 무대를 장악하고 분위기를 띄우는 화(火) 기운 풍부한 스피커를 대변인으로 세우기.',
  },
  Earth: {
    element: 'Earth',
    name: '토(土)',
    hanja: '土',
    shortConcept: '안정·신뢰',
    icon: '⛰️',
    color: '#FFB800',
    glow: 'rgba(255, 184, 0, 0.75)',
    dominantBadge: '압도적 엔진 · 대지의 경영자 DNA',
    dominantHeadline: '흔들리지 않는 거대한 태산(土)',
    dominantCounseling:
      '사주의 기운 중 묵직한 흙(土)의 비중이 가장 높습니다. 어떤 풍파와 위기 속에서도 중심을 잃지 않고 모든 자원과 사람을 품어내는 압도적인 포용력과 신뢰가 당신의 천재성입니다. 장기전에서 결국 최후의 승자가 되는 반석 같은 경영자의 숙명을 타고났습니다.',
    deficientBadge: '취약점 경보 · 중심의 불안정',
    deficientHeadline: '뿌리를 내리지 못하고 분산되는 위험',
    deficientCounseling:
      '사주에 흙과 대지(土)의 기운이 비어 있습니다. 재능과 아이디어는 넘치나 환경의 변화에 쉽게 흔들리고, 자산을 굳건히 축적하기보다는 여기저기 흩뿌려 실속이 부족해지기 쉬운 아킬레스건이 있습니다. 뿌리를 내리는 인내심이 필수적입니다.',
    solObject: '황토색/베이지색 가죽 소품, 도자기 머그잔, 단단한 원석이나 스톤 오브제 소지.',
    solBusiness: '잦은 방향 전환을 멈추고 3년 단위의 중기 로드맵 고수하기, 현금 자산을 묶어두는 강제 저축 시스템 만들기.',
    solPartner: '묵직하게 버텨주며 흔들리는 멘탈을 잡아주는 흙(土) 기운 가득한 멘토를 곁에 두기.',
  },
  Water: {
    element: 'Water',
    name: '수(水)',
    hanja: '水',
    shortConcept: '유연·지략',
    icon: '🌊',
    color: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.75)',
    dominantBadge: '압도적 엔진 · 심연의 지략가 DNA',
    dominantHeadline: '모든 틈을 파고드는 깊은 물(水)',
    dominantCounseling:
      '사주의 기운 중 유연하고 깊은 물(水)의 비중이 가장 높습니다. 장애물을 정면으로 들이받지 않고 우회하여 마침내 바다에 이르는 탁월한 유연성과 정보 수집력, 심리전의 지혜가 당신의 천재성입니다. 판의 흐름을 먼저 읽고 뒤에서 수를 놓는 책사의 숙명을 타고났습니다.',
    deficientBadge: '취약점 경보 · 융통성의 고갈',
    deficientHeadline: '정면충돌하여 상처 입는 위험',
    deficientCounseling:
      '사주에 물과 강(水)의 기운이 비어 있습니다. 직선적이고 타협을 모르는 고집으로 인해 상대의 숨은 의도를 읽지 못하거나, 막다른 길에서도 우회하지 못하고 정면충돌해 상처를 입는 아킬레스건이 있습니다. 유연한 처세와 여유가 절실합니다.',
    solObject: '블랙/네이비 톤 의상, 물병을 항상 휴대하며 자주 수분 섭취하기, 수족관이나 분수대 근처 산책.',
    solBusiness: '갈등 상황에서 즉각 반박하지 말고 "3일 뒤에 답변드리겠다"며 시간 벌기, 물러서는 것도 전략임을 기억하기.',
    solPartner: '상황 판단이 빠르고 타인의 심리를 기가 막히게 읽어내는 수(水) 기운 넘치는 지략가와 동행하기.',
  },
};

export interface TodayCircuitCardProps {
  elementsRatio?: Record<FiveElement, number> | null;
  active: boolean;
  height: number;
  saju?: SajuResult | null;
}

export const TodayCircuitCard = memo(function TodayCircuitCard({
  elementsRatio,
  active: _active,
  height,
  saju: _saju,
}: TodayCircuitCardProps) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const { isJa } = useLocale();

  // 기본 더미 데이터 (사주 정보 없을 시: 木 50%, 火 12.5%, 土 12.5%, 金 0%, 水 25%)
  const ratio = useMemo<Record<FiveElement, number>>(() => {
    if (elementsRatio) return elementsRatio;
    return {
      Wood: 50,
      Fire: 12.5,
      Earth: 12.5,
      Metal: 0,
      Water: 25,
    };
  }, [elementsRatio]);

  // 과다(가장 높은 비율) 및 결핍(0% 또는 가장 낮은 비율) 오행 산출
  const { dominant, dominantRatio, deficient, deficientRatio, isZeroDeficient } = useMemo(() => {
    let maxEl: FiveElement = 'Wood';
    let maxVal = -1;
    let minEl: FiveElement = 'Metal';
    let minVal = 999;

    ELEMENT_ORDER.forEach((el) => {
      const val = ratio[el] ?? 0;
      if (val > maxVal) {
        maxVal = val;
        maxEl = el;
      }
      if (val < minVal) {
        minVal = val;
        minEl = el;
      }
    });

    // 0%인 결핍 오행이 있다면 우선순위 배정
    const zeroEl = ELEMENT_ORDER.find((el) => (ratio[el] ?? 0) === 0);
    const defEl = zeroEl ?? minEl;
    const defVal = zeroEl ? 0 : minVal;

    return {
      dominant: maxEl,
      dominantRatio: maxVal,
      deficient: defEl,
      deficientRatio: defVal,
      isZeroDeficient: defVal === 0,
    };
  }, [ratio]);

  const dominantInfo = ELEMENT_COUNSELING_MAP[dominant];
  const deficientInfo = ELEMENT_COUNSELING_MAP[deficient];

  return (
    <View style={[styles.root, { height }]}>
      {/* 딥 다크 배경 (#0A0E18 ~ #131A2B) */}
      <LinearGradient
        colors={['#0A0E18', '#121828', '#0A0E18']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* 배경 은은한 앰버/시안 네온 글로우 */}
      <View pointerEvents="none" style={styles.ambientGlowAmber} />
      <View pointerEvents="none" style={styles.ambientGlowCyan} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 68,
          },
        ]}
      >
        {/* 상단 칩: 07 · 오행 카운셀링 */}
        <View style={styles.headerRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {isJa ? '07 · 五行カウンセリング' : '07 · 오행 카운셀링'}
            </Text>
          </View>
        </View>

        {/* 메인 타이틀 & 서브타이틀 */}
        <View style={styles.titleWrap}>
          <Text style={styles.mainTitle}>
            {isJa ? '先天五行DNA ＆ 欠乏突破処方' : '선천 오행 DNA & 결핍 돌파 솔루션'}
          </Text>
          <Text style={styles.subTitle}>
            {isJa
              ? '生まれ持った最強の武器と最大の弱点を突き、現実の補強策を処方します。'
              : '타고난 최강의 무기와 가장 치명적인 아킬레스건을 짚고, 현실의 보완책을 처방합니다.'}
          </Text>
        </View>

        {/* 1. 상단: 오행 기운 회로 게이지 */}
        <View style={[styles.circuitCard, LUXURY_GLASS]}>
          <Text style={styles.circuitHeaderTitle}>
            {isJa ? '[先天五行原局エネルギー分布]' : '[선천 오행 원국 에너지 분포]'}
          </Text>
          <View style={styles.circuitList}>
            {ELEMENT_ORDER.map((el) => {
              const info = ELEMENT_COUNSELING_MAP[el];
              const val = ratio[el] ?? 0;
              const isZero = val === 0;

              return (
                <View key={el} style={styles.circuitRow}>
                  <View style={styles.elementLabelBox}>
                    <Text style={[styles.hanjaIcon, { color: info.color }]}>{info.hanja}</Text>
                    <Text style={styles.elementNameText}>{info.name}</Text>
                  </View>
                  <View style={styles.circuitTrack}>
                    <View
                      style={[
                        styles.circuitFill,
                        {
                          width: `${Math.min(100, Math.max(0, val))}%`,
                          backgroundColor: info.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.circuitValueText, isZero && styles.circuitZeroText]}>
                    {val.toFixed(1)}%{isZero ? ' 결핍' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2. 중단: [2대 심층 진단 카드] */}
        <View style={styles.counselingGrid}>
          {/* ① 🔥 타고난 최강의 무기 (과다 오행 진단) */}
          <View style={[styles.diagnosticCard, styles.dominantCard]}>
            <View style={styles.diagnosticHeader}>
              <View style={styles.headerLeftRow}>
                <Text style={styles.cardHeaderIcon}>{dominantInfo.icon}</Text>
                <Text style={styles.cardHeaderTitleDom}>
                  타고난 최강의 무기 ({dominantInfo.hanja} {dominantRatio.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.dominantBadge}>
                <Text style={styles.dominantBadgeText}>{dominantInfo.dominantBadge}</Text>
              </View>
            </View>
            <Text style={styles.diagnosticHeadline}>{dominantInfo.dominantHeadline}</Text>
            <View style={styles.counselingBodyBoxDom}>
              <Text style={styles.counselingBodyText}>{dominantInfo.dominantCounseling}</Text>
            </View>
          </View>

          {/* ② ⚠️ 치명적인 아킬레스건 (결핍 오행 진단) */}
          <View style={[styles.diagnosticCard, styles.deficientCard]}>
            <View style={styles.diagnosticHeader}>
              <View style={styles.headerLeftRow}>
                <Text style={styles.cardHeaderIcon}>⚠️</Text>
                <Text style={styles.cardHeaderTitleDef}>
                  치명적인 아킬레스건 ({isZeroDeficient ? '완전 결핍' : '최대 취약'}: {deficientInfo.hanja}{' '}
                  {deficientRatio.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.deficientBadge}>
                <Text style={styles.deficientBadgeText}>{deficientInfo.deficientBadge}</Text>
              </View>
            </View>
            <Text style={styles.diagnosticHeadlineDef}>{deficientInfo.deficientHeadline}</Text>
            <View style={styles.counselingBodyBoxDef}>
              <Text style={styles.counselingBodyTextDef}>{deficientInfo.deficientCounseling}</Text>
            </View>
          </View>
        </View>

        {/* 3. 하단 CTA 버튼: 결핍 보완 3대 실전 비책 보기 */}
        <Pressable
          onPress={() => {
            void playHaptic('tap');
            setModalVisible(true);
          }}
          style={({ pressed }) => [styles.ctaButton, GOLD_CTA_SHADOW, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={['#FFB800', '#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.ctaButtonText}>
            {deficientInfo.icon} {isJa
              ? `不足している${deficientInfo.hanja}(${deficientInfo.shortConcept})の気を補う3大実戦秘策を見る ➔`
              : `부족한 ${deficientInfo.hanja}(${deficientInfo.shortConcept}) 기운 채우는 3대 실전 비책 보기 ➔`}
          </Text>
        </Pressable>
      </ScrollView>

      {/* ======================================================== */}
      {/* 결핍 보완 실전 처방 모달 */}
      {/* ======================================================== */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalCard, LUXURY_GLASS]}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalKicker}>
                  {isJa ? '現実の五行人工補強ソリューション' : '현실 오행 인공 수혈 솔루션'}
                </Text>
                <Text style={styles.modalTitle}>
                  {deficientInfo.icon} [{deficientInfo.hanja} {isJa ? '欠乏突破の3大実戦処方' : '결핍 돌파 3대 실전 비책'}]
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  setModalVisible(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              {/* 결핍 기운 안내 바 */}
              <View style={styles.modalBanner}>
                <Text style={styles.modalBannerText}>
                  사주에 비어 있는 <Text style={styles.bannerHighlight}>{deficientInfo.name}({deficientInfo.shortConcept})</Text> 기운을
                  사물·행동·사람으로 채워 넣는 특급 처방입니다.
                </Text>
              </View>

              {/* 1) 몸에 지닐 물건 */}
              <View style={styles.solutionBox}>
                <View style={styles.solutionHeader}>
                  <Text style={styles.solutionBadge}>1. 몸에 지닐 물건 (오브제)</Text>
                </View>
                <Text style={styles.solutionText}>{deficientInfo.solObject}</Text>
              </View>

              {/* 2) 비즈니스 행동 수칙 */}
              <View style={styles.solutionBox}>
                <View style={styles.solutionHeader}>
                  <Text style={styles.solutionBadge}>2. 비즈니스 행동 수칙 (룰북)</Text>
                </View>
                <Text style={styles.solutionText}>{deficientInfo.solBusiness}</Text>
              </View>

              {/* 3) 인연 보완법 */}
              <View style={styles.solutionBox}>
                <View style={styles.solutionHeader}>
                  <Text style={styles.solutionBadge}>3. 인연 보완법 (파트너십)</Text>
                </View>
                <Text style={styles.solutionText}>{deficientInfo.solPartner}</Text>
              </View>

              {/* 닫기 버튼 */}
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  setModalVisible(false);
                }}
                style={styles.modalConfirmBtn}
              >
                <Text style={styles.modalConfirmText}>
                  {isJa ? '秘策を確認して気を補強する' : '비책 확인 및 기운 수혈하기'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0A0E18',
  },
  scrollBody: {
    paddingHorizontal: 16,
  },
  ambientGlowAmber: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    ...(IS_WEB ? ({ filter: 'blur(55px)' } as unknown as ViewStyle) : null),
  },
  ambientGlowCyan: {
    position: 'absolute',
    top: 220,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    ...(IS_WEB ? ({ filter: 'blur(55px)' } as unknown as ViewStyle) : null),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
  },
  chipText: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleWrap: {
    marginBottom: 10,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 25,
    letterSpacing: -0.3,
    ...KEEP_ALL,
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16.5,
    ...KEEP_ALL,
  },

  /* 1. 오행 기운 회로 게이지 카드 */
  circuitCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    marginBottom: 10,
  },
  circuitHeaderTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  circuitList: {
    gap: 7,
  },
  circuitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elementLabelBox: {
    width: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hanjaIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  elementNameText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  circuitTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#0B1120',
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  circuitFill: {
    height: '100%',
    borderRadius: 999,
  },
  circuitValueText: {
    width: 64,
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  circuitZeroText: {
    color: '#FF4D6D',
    fontWeight: '900',
  },

  /* 2. [2대 심층 진단 카드] 그리드 */
  counselingGrid: {
    gap: 10,
    marginBottom: 14,
  },
  diagnosticCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  dominantCard: {
    backgroundColor: 'rgba(25, 20, 10, 0.88)',
    borderColor: 'rgba(255, 184, 0, 0.45)',
  },
  deficientCard: {
    backgroundColor: 'rgba(26, 10, 14, 0.88)',
    borderColor: 'rgba(255, 42, 75, 0.45)',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardHeaderIcon: {
    fontSize: 13,
  },
  cardHeaderTitleDom: {
    color: '#FFD700',
    fontSize: 12.5,
    fontWeight: '900',
  },
  cardHeaderTitleDef: {
    color: '#FF6B7F',
    fontSize: 12.5,
    fontWeight: '900',
  },
  dominantBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.14)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
  },
  dominantBadgeText: {
    color: '#FFB800',
    fontSize: 9.5,
    fontWeight: '800',
  },
  deficientBadge: {
    backgroundColor: 'rgba(255, 42, 75, 0.14)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.35)',
  },
  deficientBadgeText: {
    color: '#FF4D6D',
    fontSize: 9.5,
    fontWeight: '800',
  },
  diagnosticHeadline: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    marginTop: 2,
    marginBottom: 6,
    ...KEEP_ALL,
  },
  diagnosticHeadlineDef: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    marginTop: 2,
    marginBottom: 6,
    ...KEEP_ALL,
  },
  counselingBodyBoxDom: {
    backgroundColor: 'rgba(15, 10, 4, 0.75)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
  },
  counselingBodyBoxDef: {
    backgroundColor: 'rgba(18, 5, 8, 0.75)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.2)',
  },
  counselingBodyText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  counselingBodyTextDef: {
    color: '#FEE2E2',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },

  /* 3. 하단 CTA 버튼 */
  ctaButton: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  ctaButtonText: {
    color: '#0A0700',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.2,
    ...KEEP_ALL,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  /* 모달 스타일 */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalBackdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: '#0F1424',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalKicker: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '800',
  },
  modalScrollBody: {
    gap: 12,
  },
  modalBanner: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    padding: 12,
  },
  modalBannerText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  bannerHighlight: {
    color: '#FFD700',
    fontWeight: '900',
  },
  solutionBox: {
    backgroundColor: 'rgba(18, 25, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    gap: 6,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  solutionBadge: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: '900',
  },
  solutionText: {
    color: '#F1F5F9',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  modalConfirmBtn: {
    marginTop: 6,
    backgroundColor: '#FFB800',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#0A0700',
    fontSize: 14,
    fontWeight: '900',
  },
});
