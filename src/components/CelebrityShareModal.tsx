import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import type { CelebrityMatchResult } from '../engine/celebrityEngine';
import { playHaptic } from './reels/haptics';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

interface Props {
  visible: boolean;
  onClose: () => void;
  celebrityResult: CelebrityMatchResult | null;
  userDayMaster: string;
}

interface TunerCelebrity {
  id: string;
  name: string;
  title: string;
  sajuFact: string;
  archetype: string;
  quote: string;
  accentColor: string;
  glowColor: string;
  badgeBg: string;
  originDestiny: string;
  realityAction: string;
}

const TUNER_CELEBRITIES: Record<'musk' | 'jobs' | 'huang' | 'buffett', TunerCelebrity> = {
  musk: {
    id: 'elon-musk',
    name: '일론 머스크',
    title: '테슬라·스페이스X CEO / 화성을 향한 승부사',
    sajuFact: '戊土 × 偏官 돌파형 개척자',
    archetype: '확률을 깨는 돌파형 개척자',
    quote: '중요한 일이라면, 확률이 내 편이 아니어도 해야 한다.',
    accentColor: '#FF2A4B',
    glowColor: 'rgba(255, 42, 75, 0.75)',
    badgeBg: 'rgba(255, 42, 75, 0.14)',
    originDestiny:
      '거대한 태산(戊土) 같은 뚝심 위에 극도의 중압감을 뚫어내는 편관(偏官)의 칼날을 품었습니다. 남들이 무모하다고 비웃는 불가능의 영역을 홀로 정면 돌파하는 사주적 기세를 지닙니다.',
    realityAction:
      '자본과 파산의 벼랑 끝에서도 계산기 대신 파괴적 혁신에 올인하는 극단적 승부사 기질이 당신의 영혼 코어와 90% 이상 완벽히 동기화되어 있습니다.',
  },
  jobs: {
    id: 'steve-jobs',
    name: '스티브 잡스',
    title: '애플 창업자 / 혁신적 비전가',
    sajuFact: '丙火 × 傷官 세상을 바꾼 직관',
    archetype: '미학을 밀어붙이는 비전가',
    quote: '늘 갈망하고, 우직하게 나아가라. (Stay hungry, stay foolish.)',
    accentColor: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.75)',
    badgeBg: 'rgba(0, 240, 255, 0.14)',
    originDestiny:
      '세상을 환하게 비추는 태양(丙火)의 열정 위에 기존의 틀과 권위를 과감히 깨부수는 상관(傷官)의 천재적 직관이 결합되었습니다. 완벽한 디테일과 타협 없는 미학을 끝까지 밀어붙입니다.',
    realityAction:
      '논리와 시장 조사보다는 내면의 직관과 결단을 믿으며, 세상의 기준을 나에게 맞추어 재창조하려는 강력한 현실 왜곡장(Reality Distortion)이 당신과 깊게 공명합니다.',
  },
  huang: {
    id: 'jensen-huang',
    name: '젠슨 황',
    title: '엔비디아 CEO / 가죽자켓의 AI 연금술사',
    sajuFact: '庚金 × 偏財 판을 읽는 집념',
    archetype: '판을 읽는 끈질긴 집념',
    quote: '위대함은 지능에서 오지 않는다. 위대함은 고통을 견디는 품격에서 나온다.',
    accentColor: '#00FF88',
    glowColor: 'rgba(0, 255, 136, 0.75)',
    badgeBg: 'rgba(0, 255, 136, 0.14)',
    originDestiny:
      '단단한 원석과 칼날(庚金)의 냉철함 위에 거대한 판의 흐름을 꿰뚫어보는 편재(偏財)의 사업적 육감이 장착되었습니다. 10년을 앞서 내다보고 묵묵히 칼을 가는 끈기를 보입니다.',
    realityAction:
      '모두가 외면하던 시기에도 흔들리지 않고 거대한 흐름의 길목을 선점하여 독점적 영역을 구축하는 고통을 견디는 승부수가 당신의 기운과 70% 이상 일치합니다.',
  },
  buffett: {
    id: 'warren-buffett',
    name: '워런 버핏',
    title: '버크셔 해서웨이 회장 / 오마하의 현인',
    sajuFact: '己土 × 正財 복리의 거인',
    archetype: '복리를 굴리는 인내의 현인',
    quote: '남들이 탐욕을 부릴 때 두려워하고, 남들이 두려워할 때 탐욕을 가져라.',
    accentColor: '#FFB800',
    glowColor: 'rgba(255, 184, 0, 0.75)',
    badgeBg: 'rgba(255, 184, 0, 0.14)',
    originDestiny:
      '만물을 품고 키워내는 비옥한 전답(己土)의 끈기 위에 티끌 모아 태산을 이루는 정재(正財)의 치밀한 관리력이 극대화된 명식입니다. 일시적 유행에 흔들리지 않는 뿌리 깊은 안정성을 자랑합니다.',
    realityAction:
      '감정적 충동을 철저히 배제하고 시간의 힘을 아군으로 만들어 결국 마지막에 웃는 느리지만 가장 확실한 복리의 법칙이 당신의 방어적 기질과 일치합니다.',
  },
};

function getCelebByFreq(freq: number): TunerCelebrity {
  if (freq >= 90) return TUNER_CELEBRITIES.musk;
  if (freq >= 80) return TUNER_CELEBRITIES.jobs;
  if (freq >= 70) return TUNER_CELEBRITIES.huang;
  return TUNER_CELEBRITIES.buffett;
}

const CARD_RATIO = 9 / 16;
const BUTTON_AREA_HEIGHT = 110;
const SCREEN_PADDING = 16;

function formatToday(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}.${mm}.${dd}`;
}

export function CelebrityShareModal({ visible, onClose, celebrityResult, userDayMaster }: Props) {
  const { width, height } = useWindowDimensions();
  const [isSharing, setIsSharing] = useState(false);

  // 기본 주파수 슬라이더 초기값 (사용자 사주 기반 syncRate 반영, 60~99% 범위)
  const initialFreq = useMemo(() => {
    const raw = celebrityResult?.syncRate ? Math.round(celebrityResult.syncRate) : 81;
    return Math.max(60, Math.min(99, raw));
  }, [celebrityResult]);

  const [sliderFreq, setSliderFreq] = useState<number>(initialFreq);

  // 모달이 열릴 때마다 기본 일치율로 동기화
  useEffect(() => {
    if (visible) {
      setSliderFreq(initialFreq);
    }
  }, [visible, initialFreq]);

  const currentCeleb = useMemo(() => getCelebByFreq(sliderFreq), [sliderFreq]);

  if (!visible) {
    return null;
  }

  const maxHeight = Math.max(380, height - BUTTON_AREA_HEIGHT);
  const maxWidth = Math.min(420, Math.max(220, width - SCREEN_PADDING * 2));
  const cardWidth = Math.min(maxWidth, maxHeight * CARD_RATIO);
  const cardHeight = Math.min(maxHeight, cardWidth / CARD_RATIO);
  const scale = Math.min(1, Math.max(0.78, cardWidth / 340));
  const circleSize = Math.round(92 * scale);

  // 인스타 스토리에 공유하기 (서버비 0원 클라이언트 캡처 & Web Share API)
  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    void playHaptic('tap');

    try {
      if (IS_WEB) {
        const node = document.getElementById('soul-frequency-card');
        if (!node) {
          Alert.alert('공유 실패', '카드 요소를 찾을 수 없습니다.');
          return;
        }

        // html-to-image 동적 import 및 9:16 인스타 스토리 캡처
        const { toBlob, toPng } = await import('html-to-image');

        // 모바일 Web Share API 체크
        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
          try {
            const blob = await toBlob(node, {
              quality: 0.95,
              pixelRatio: 2,
            });
            if (blob) {
              const file = new File(
                [blob],
                `cyber-saju-${currentCeleb.id}-${sliderFreq}.png`,
                { type: 'image/png' }
              );
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: `사이버 사주 // 영혼의 공명 [${currentCeleb.name}]`,
                  text: `나와 영혼 주파수가 ${sliderFreq}% 일치하는 인물: ${currentCeleb.name} (${currentCeleb.sajuFact})`,
                });
                return;
              }
            }
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') return;
            console.warn('Web Share fallback to direct download:', shareErr);
          }
        }

        // PC 환경 또는 Web Share 미지원 시 PNG 직접 다운로드
        const dataUrl = await toPng(node, {
          quality: 0.95,
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        link.download = `cyber-saju-${currentCeleb.id}-${sliderFreq}pct.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Alert.alert(
          '📸 인스타 스토리 카드 저장 완료',
          '네온 카드가 저장되었습니다. 인스타그램 스토리(9:16)에 공유해 보세요!'
        );
      } else {
        Alert.alert('안내', '현재 브라우저 환경에서 인스타 카드 저장이 지원됩니다.');
      }
    } catch (err: any) {
      console.error('인스타 공유 오류:', err);
      Alert.alert('공유 오류', '이미지 생성 중 문제가 발생했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* 인스타 스토리 9:16 네온 캡처 대상 카드 */}
        <View
          // @ts-ignore (React Native Web id attribute)
          id="soul-frequency-card"
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              borderColor: currentCeleb.accentColor,
              shadowColor: currentCeleb.accentColor,
            },
            IS_WEB
              ? ({
                  boxShadow: `0 0 24px ${currentCeleb.glowColor}`,
                } as unknown as ViewStyle)
              : null,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.cardScroll, { padding: Math.round(12 * scale) }]}
          >
            {/* 1. 상단 사이버 헤더 */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: currentCeleb.accentColor }]} numberOfLines={1}>
                CYBER-SAJU // SOUL FREQUENCY MATRIX
              </Text>
              <Text style={styles.headerDate}>{formatToday()}</Text>
            </View>

            {/* 2. 원형 일치율 게이지 */}
            <View style={styles.syncWrap}>
              <View
                style={[
                  styles.syncCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    borderColor: currentCeleb.accentColor,
                  },
                  IS_WEB
                    ? ({
                        boxShadow: `0 0 18px ${currentCeleb.glowColor}`,
                      } as unknown as ViewStyle)
                    : null,
                ]}
              >
                <Text style={styles.syncBolt}>⚡</Text>
                <Text
                  style={[
                    styles.syncValue,
                    {
                      fontSize: Math.round(26 * scale),
                      color: currentCeleb.accentColor,
                      textShadowColor: currentCeleb.glowColor,
                    },
                  ]}
                >
                  {sliderFreq}%
                </Text>
                <Text style={styles.syncLabel}>주파수 동조</Text>
              </View>
            </View>

            {/* 3. [신규] 세련된 네온 주파수 라디오 슬라이더 (<input type="range">) */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeaderRow}>
                <Text style={styles.sliderHeaderLabel}>TUNER FREQUENCY</Text>
                <Text style={[styles.sliderHeaderFreq, { color: currentCeleb.accentColor }]}>
                  {sliderFreq}Hz / %
                </Text>
              </View>

              {IS_WEB ? (
                <View style={styles.rangeInputContainer}>
                  <input
                    type="range"
                    min={60}
                    max={99}
                    step={1}
                    value={sliderFreq}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSliderFreq(val);
                      void playHaptic('tap');
                    }}
                    style={{
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      outline: 'none',
                      background: `linear-gradient(90deg, #FFB800 0%, #00FF88 33%, #00F0FF 66%, #FF2A4B 100%)`,
                      cursor: 'pointer',
                      accentColor: currentCeleb.accentColor,
                    }}
                  />
                </View>
              ) : (
                <View style={styles.mobileSliderTrack}>
                  <View
                    style={[
                      styles.mobileSliderFill,
                      {
                        width: `${((sliderFreq - 60) / 39) * 100}%`,
                        backgroundColor: currentCeleb.accentColor,
                      },
                    ]}
                  />
                </View>
              )}

              {/* 주파수 대역 인물 힌트 */}
              <View style={styles.sliderTickLabels}>
                <Pressable onPress={() => setSliderFreq(65)}>
                  <Text style={[styles.sliderTickText, sliderFreq < 70 && styles.sliderTickActive]}>
                    60% 버핏
                  </Text>
                </Pressable>
                <Pressable onPress={() => setSliderFreq(75)}>
                  <Text
                    style={[
                      styles.sliderTickText,
                      sliderFreq >= 70 && sliderFreq < 80 && styles.sliderTickActive,
                    ]}
                  >
                    70% 젠슨황
                  </Text>
                </Pressable>
                <Pressable onPress={() => setSliderFreq(85)}>
                  <Text
                    style={[
                      styles.sliderTickText,
                      sliderFreq >= 80 && sliderFreq < 90 && styles.sliderTickActive,
                    ]}
                  >
                    80% 잡스
                  </Text>
                </Pressable>
                <Pressable onPress={() => setSliderFreq(95)}>
                  <Text style={[styles.sliderTickText, sliderFreq >= 90 && styles.sliderTickActive]}>
                    90%+ 머스크
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 4. 인물 정보 & 사주 팩트 뱃지 */}
            <View style={styles.identity}>
              <Text style={[styles.name, { fontSize: Math.round(20 * scale) }]} numberOfLines={1}>
                {currentCeleb.name}
              </Text>
              <Text style={styles.title} numberOfLines={1}>
                {currentCeleb.title}
              </Text>
              <View
                style={[
                  styles.tag,
                  {
                    borderColor: currentCeleb.accentColor,
                    backgroundColor: currentCeleb.badgeBg,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: currentCeleb.accentColor }]}>
                  ⚡ {currentCeleb.sajuFact}
                </Text>
              </View>
            </View>

            {/* 5. 명언 카드 */}
            <View style={styles.quoteBox}>
              <Text style={[styles.quoteText, { fontSize: Math.round(11 * scale) }]}>
                ❝ {currentCeleb.quote} ❞
              </Text>
            </View>

            {/* 6. [신규] 사주적 일치 이유 심층 해단 (2대 단락) */}
            <View style={styles.deepAnalysisBox}>
              {/* 1) 본원과 십신의 결 */}
              <View style={styles.analysisItem}>
                <View style={styles.analysisItemHeader}>
                  <Text style={[styles.analysisItemTitle, { color: currentCeleb.accentColor }]}>
                    ☯️ 본원과 십신의 결
                  </Text>
                </View>
                <Text style={styles.analysisItemBody}>{currentCeleb.originDestiny}</Text>
              </View>

              {/* 2) 현실 행동 동기화 */}
              <View style={styles.analysisItem}>
                <View style={styles.analysisItemHeader}>
                  <Text style={[styles.analysisItemTitle, { color: currentCeleb.accentColor }]}>
                    ⚡ 현실 행동 동기화
                  </Text>
                </View>
                <Text style={styles.analysisItemBody}>{currentCeleb.realityAction}</Text>
              </View>
            </View>

            {/* 7. 푸터 */}
            <View style={styles.footer}>
              <Text style={styles.footerBrand}>
                CYBER-SAJU // {userDayMaster ? `${userDayMaster} 일간 공명` : 'LOCAL EDGE AI'}
              </Text>
              <Text style={styles.footerCta}>INSTAGRAM STORY SPEC // 9:16</Text>
            </View>
          </ScrollView>
        </View>

        {/* 하단 컨트롤 버튼 영역 */}
        <View style={[styles.buttonRow, { width: cardWidth }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: currentCeleb.accentColor }]}
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.8}
          >
            <Text style={styles.shareBtnText}>
              {isSharing ? '📸 스토리 캡처 중...' : '📲 인스타 스토리에 공유하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#0A0F1D',
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardScroll: {
    gap: 8,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerDate: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
  },

  /* 싱크로율 원형 게이지 */
  syncWrap: {
    alignItems: 'center',
    marginTop: 2,
  },
  syncCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  syncBolt: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  syncValue: {
    fontWeight: '900',
    lineHeight: 28,
  },
  syncLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  /* 라디오 슬라이더 섹션 */
  sliderSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderHeaderLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sliderHeaderFreq: {
    fontSize: 11,
    fontWeight: '900',
  },
  rangeInputContainer: {
    width: '100%',
    paddingVertical: 4,
  },
  mobileSliderTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  mobileSliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderTickLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderTickText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  sliderTickActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  /* 인물 아이덴티티 */
  identity: {
    alignItems: 'center',
    marginTop: 2,
  },
  name: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    color: '#94A3B8',
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 2,
  },
  tag: {
    marginTop: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* 명언 박스 */
  quoteBox: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 2,
    borderLeftColor: '#64748B',
  },
  quoteText: {
    color: '#E2E8F0',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 15,
    ...KEEP_ALL,
  },

  /* 사주 심층 해단 (2대 단락) */
  deepAnalysisBox: {
    backgroundColor: 'rgba(10, 15, 30, 0.75)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 6,
  },
  analysisItem: {
    gap: 2,
  },
  analysisItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisItemTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  analysisItemBody: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14.5,
    ...KEEP_ALL,
  },

  /* 푸터 */
  footer: {
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  footerBrand: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  footerCta: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },

  /* 하단 액션 버튼 */
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  closeBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  shareBtn: {
    flex: 2.2,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
