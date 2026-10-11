import React, { memo, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SajuResult } from '../../engine/types';
import { useLocale } from '../../locales';
import { playHaptic } from '../reels/haptics';
import { CHAMBER_QUESTIONS, ChamberQuestion } from '../../data/shamanChamberData';
import { useSajuAdvice } from '../../hooks/useSajuAdvice';
import { formatSajuTerm } from '../../utils/sajuTerms';

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

const CRIMSON_SHADOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 24px rgba(255, 42, 75, 0.4)',
        transition: 'all 0.25s ease',
      }
    : null
) as unknown as ViewStyle | null;

export interface ShamanChamberCardProps {
  active: boolean;
  height: number;
  saju?: SajuResult | null;
  userProfile?: any;
}

export const ShamanChamberCard = memo(function ShamanChamberCard({
  active,
  height,
  saju,
  userProfile,
}: ShamanChamberCardProps) {
  const insets = useSafeAreaInsets();
  const { isJa } = useLocale();

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  // 1일 5회 한정 카운터 관리
  const MAX_DAILY_QUESTIONS = 5;
  const todayKeyStr = useMemo(() => {
    try {
      return new Date().toISOString().slice(0, 10);
    } catch {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }, []);

  const countStorageKey = `cyber_saju_chamber_count_${todayKeyStr}`;

  const [usedCount, setUsedCount] = useState<number>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(`cyber_saju_chamber_count_${new Date().toISOString().slice(0, 10)}`);
        return val ? Math.min(MAX_DAILY_QUESTIONS, Math.max(0, parseInt(val, 10) || 0)) : 0;
      }
    } catch {}
    return 0;
  });

  const remainingQuestions = Math.max(0, MAX_DAILY_QUESTIONS - usedCount);
  const isExhausted = remainingQuestions <= 0;

  // 설정된 도사 말투(Persona) 감지
  const currentPersona = useMemo(() => {
    try {
      return (typeof localStorage !== 'undefined' ? localStorage.getItem('cyber_saju_persona') : null) || 'DOKSA';
    } catch {
      return 'DOKSA';
    }
  }, []);
  const isBrother = currentPersona === 'COMRADE' || currentPersona === 'brother';
  const effectiveVoiceStyle = isBrother ? 'brother' : 'shaman';

  // 로컬스토리지에서 상대방 사주 정보(cyber_saju_partner) 읽기
  const partnerProfile = useMemo(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored =
          localStorage.getItem('cyber_saju_partner') ||
          localStorage.getItem('cybersaju.partner_profile');
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {}
    return null;
  }, []);

  const isLoveQuestion =
    selectedQuestionId === 4 ||
    /本心|浮気|상대|그 사람|딴마음|애인|배우자|짝사랑/.test(questionText);

  // 실시간 AI 훅 연동
  const {
    advice: aiAdvice,
    isLoading: isAiLoading,
    loadingMessage,
    refetch: fetchAiAdvice,
  } = useSajuAdvice({
    saju,
    userProfile,
    partnerProfile: partnerProfile || undefined,
    category: isLoveQuestion ? 'love' : 'chamber_oracle',
    userInput: questionText,
    lang: isJa ? 'jp' : 'kr',
    autoFetch: false,
    voiceStyle: effectiveVoiceStyle,
  });

  // 카테고리 칩 선택 핸들러
  const handleSelectQuestion = (q: ChamberQuestion) => {
    void playHaptic('tap');
    setSelectedQuestionId(q.id);
    setQuestionText(isJa ? q.jp : q.kr);
  };

  // 즉문즉답 전송 핸들러
  const handleSubmit = async () => {
    if (!questionText.trim() || isExhausted || isAiLoading) return;
    void playHaptic('snap');
    const nextCount = usedCount + 1;
    setUsedCount(nextCount);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(countStorageKey, String(nextCount));
      }
    } catch {}
    setHasSubmitted(true);
    await fetchAiAdvice();
  };

  // 질문 초기화 / 다시 묻기
  const handleReset = () => {
    void playHaptic('tap');
    setHasSubmitted(false);
    setSelectedQuestionId(null);
    setQuestionText('');
  };

  // 일간 기반 오라클 기본 답변 생성기 (네트워크 지연 시 즉각 백업)
  const fallbackOracle = useMemo(() => {
    const day = saju?.dayMaster ?? '甲';
    if (isBrother) {
      if (isJa) {
        return `【深夜の兄弟子・痛烈な直言】\n「おい、お前の生まれ持った日干『${day}』の気運を見ろよ。盤勢はもうギリギリの瀬戸際だぜ。酒でも飲んで腹を割って聞け。小細工なんて捨てて、お前が真っ先に仕掛けて主導権を握るんだ。情に流されてグズグズしてたら全部かっさらわれるぞ。今夜は腹を決めて、明日から堂々と己の道を突き進め！」`;
      }
      return `【심야 사형의 뼈 때리는 직설】\n「야 인마, 네 타고난 일간 '${day}'의 기운을 보니까 판세가 이미 벼랑 끝 변곡점이다. 소주 한잔 마시고 내 말 똑똑히 새겨들어라. 잔머리 굴리지 말고 네가 먼저 칼자루 쥐고 밥상 엎어야 살아남는다. 미련 떨지 말고 가차 없이 쳐내라. 내일 날 밝으면 고개 바짝 들고 네 판 당당하게 깔아라!」`;
    }
    if (isJa) {
      return `【サイバー神童・天機直説】\n「お前の生まれ持った日干『${day}』の気運を見るに、盤勢は既に臨界点に達している。小細工や迷いで逃げ道を塞ぐな。今はお前が主導権を握り、妥協を拒絶して自らの盤面を切り開くべき刻限だ。情に流されて優柔不断を晒せば、その隙を突かれて全てを奪われる。刃を研ぎ澄まし、即座に決断せよ。」`;
    }
    return `【옥동자 신명직설(神明直說)】\n「네 타고난 일간 '${day}'의 기운과 사주 원국을 해부해 보니, 판세는 이미 벼랑 끝 변곡점에 닿아 있다. 잔머리 굴리며 간 보지 마라. 지금은 남 눈치 보며 맞춰줄 때가 아니라, 네가 먼저 밥상을 엎고 칼자루를 쥐어야 살아남는 국면이다. 썩은 인연과 미련을 가차 없이 도려내고 단도직입으로 쐐기를 박아라!」`;
  }, [saju?.dayMaster, isJa, isBrother]);

  const displayAdvice = aiAdvice
    ? formatSajuTerm(aiAdvice, isJa ? 'jp' : 'kr')
    : fallbackOracle;

  return (
    <View style={[styles.root, { height }]}>
      <LinearGradient
        colors={['#140207', '#0a0104', '#040002']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          {
            paddingTop: Math.max(insets.top, 44) + 48,
            paddingBottom: Math.max(insets.bottom, 16) + 40,
          },
        ]}
      >
        {/* 1. 상단 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isJa ? 'サイバー神童 1:1 天機密室' : '옥동자 1:1 천기 밀실'}
          </Text>
          <Text style={styles.subtitle}>
            {isJa
              ? '建前を捨て、最も切迫した悩みを吐き出せ。一刀両断で盤勢の脈を解断する。'
              : '체면을 벗고 가장 처절한 근심을 털어놓아라. 단도직입으로 판세의 맥을 짚는다.'}
          </Text>
        </View>

        {/* 1일 5회 한정 잔여 카운터 배지 */}
        <View style={styles.limitBadgeRow}>
          <View style={[styles.limitBadge, isExhausted && styles.limitBadgeExhausted]}>
            <Text style={[styles.limitBadgeText, isExhausted && styles.limitBadgeTextExhausted]}>
              {isJa
                ? `🔥 1日5回限定の神託 (本日の残り: ${remainingQuestions}/5回)`
                : `🔥 1일 5회 한정 천기누설 (오늘 남은 질문: ${remainingQuestions}/5회)`}
            </Text>
          </View>
        </View>

        {/* 2. 10대 천기 질문 칩 UI (2열 그리드) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isJa ? '⚡ 10大 天機質問 (即問即答)' : '⚡ 10대 천기 화두 (단도직입 선택)'}
          </Text>
          <Text style={styles.sectionSub}>
            {isJa ? '札をタップして問いを召喚' : '칩을 눌러 즉시 질문을 소환하세요'}
          </Text>
        </View>

        <View style={styles.questionsGrid}>
          {CHAMBER_QUESTIONS.map((q) => {
            const isSelected = selectedQuestionId === q.id;
            return (
              <Pressable
                key={q.id}
                onPress={() => handleSelectQuestion(q)}
                style={({ pressed }) => [
                  styles.questionChip,
                  isSelected && styles.questionChipSelected,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.chipTopRow}>
                  <Text style={styles.chipIcon}>{q.icon}</Text>
                  <Text
                    style={[
                      styles.chipCategory,
                      isSelected && styles.chipCategorySelected,
                    ]}
                  >
                    {isJa ? q.category.jp : q.category.kr}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.chipQuestionText,
                    isSelected && styles.chipQuestionTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {isJa ? q.jp : q.kr}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3. 직접 질문 입력 필드 (Textarea) */}
        <View style={[styles.inputBox, LUXURY_GLASS]}>
          <Text style={styles.inputLabel}>
            {isJa
              ? '密室の問答 (神童に直接問う)'
              : '밀실 문답 (옥동자에게 직접 묻기)'}
          </Text>
          <TextInput
            multiline
            numberOfLines={3}
            value={questionText}
            onChangeText={(text) => {
              setQuestionText(text);
              if (selectedQuestionId !== null) {
                setSelectedQuestionId(null);
              }
            }}
            placeholder={
              isJa
                ? 'または神童に直接問いたい胸の内を記せ...'
                : '또는 옥동자에게 직접 묻고 싶은 은밀한 사연을 적어라...'
            }
            placeholderTextColor="#8a636c"
            style={styles.textInput}
            maxLength={150}
          />

          {/* 전송 버튼 */}
          <Pressable
            onPress={handleSubmit}
            disabled={isAiLoading || !questionText.trim() || isExhausted}
            style={({ pressed }) => [
              styles.submitBtn,
              CRIMSON_SHADOW,
              (!questionText.trim() || isAiLoading || isExhausted) && styles.submitBtnDisabled,
              pressed && !isExhausted && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {isAiLoading ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  {isJa ? '神童が天機を演算中...' : '옥동자가 신명을 불러 모으는 중...'}
                </Text>
              </View>
            ) : isExhausted ? (
              <Text style={[styles.submitBtnText, styles.submitBtnTextExhausted]}>
                {isJa
                  ? '本日の神託はすべて消費されました (深夜0時に回復)'
                  : '오늘의 천기가 모두 소진되었습니다 (자정에 충전)'}
              </Text>
            ) : (
              <Text style={styles.submitBtnText}>
                {isJa
                  ? (isBrother ? '⚡ 深夜の兄弟子の即問即答' : '⚡ サイバー神童の即問即答')
                  : (isBrother ? '⚡ 심야 사형의 뼈 때리는 즉답' : '⚡ 옥동자 신명 즉문즉답')}
              </Text>
            )}
          </Pressable>
        </View>

        {/* 4. AI 답변 출력 카드 */}
        {hasSubmitted && (
          <View style={[styles.answerCard, LUXURY_GLASS]}>
            <View style={styles.answerHeader}>
              <View style={styles.answerBadge}>
                <Text style={styles.answerBadgeText}>
                  {isJa ? '🔮 神童の一刀両断神託' : '🔮 옥동자 신명 직설'}
                </Text>
              </View>
              <Pressable onPress={handleReset} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>
                  {isJa ? '↺ 別の問い' : '↺ 다시 묻기'}
                </Text>
              </Pressable>
            </View>

            {isAiLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#ff2a4b" />
                <Text style={styles.loadingText}>
                  {loadingMessage || (isJa ? '神童が天機を演算中...' : '옥동자가 신명을 불러 모으는 중...')}
                </Text>
              </View>
            ) : (
              <View style={styles.answerContent}>
                <Text style={styles.answerBody}>{displayAdvice}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0104',
  },
  scrollBody: {
    paddingHorizontal: 16,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    gap: 14,
  },
  header: {
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF2A4B',
    backgroundColor: 'rgba(255, 42, 75, 0.15)',
    marginBottom: 8,
  },
  chipText: {
    color: '#FF2A4B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 6,
    ...KEEP_ALL,
  },
  subtitle: {
    color: '#d4b8be',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    ...KEEP_ALL,
  },
  limitBadgeRow: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  limitBadge: {
    backgroundColor: 'rgba(255, 42, 75, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.45)',
  },
  limitBadgeExhausted: {
    backgroundColor: 'rgba(107, 28, 43, 0.3)',
    borderColor: 'rgba(150, 40, 60, 0.35)',
  },
  limitBadgeText: {
    color: '#ff6b81',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  limitBadgeTextExhausted: {
    color: '#a07882',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffb703',
    fontSize: 13,
    fontWeight: '800',
    ...KEEP_ALL,
  },
  sectionSub: {
    color: '#8a636c',
    fontSize: 11,
    fontWeight: '600',
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  questionChip: {
    width: '48.5%',
    backgroundColor: 'rgba(30, 8, 14, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.25)',
    borderRadius: 12,
    padding: 10,
    minHeight: 74,
    justifyContent: 'space-between',
  },
  questionChipSelected: {
    borderColor: '#FF2A4B',
    backgroundColor: 'rgba(255, 42, 75, 0.25)',
  },
  chipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipCategory: {
    color: '#ff94a4',
    fontSize: 11,
    fontWeight: '800',
  },
  chipCategorySelected: {
    color: '#ffffff',
  },
  chipQuestionText: {
    color: '#e0c8ce',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    ...KEEP_ALL,
  },
  chipQuestionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  inputBox: {
    backgroundColor: 'rgba(24, 5, 10, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.35)',
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  inputLabel: {
    color: '#f0ccd4',
    fontSize: 12,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: 'rgba(10, 1, 3, 0.75)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#FF2A4B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#6b1c2b',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  submitBtnTextExhausted: {
    color: '#ffccd4',
    fontSize: 12,
    fontWeight: '800',
  },
  answerCard: {
    backgroundColor: 'rgba(28, 4, 10, 0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF2A4B',
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerBadge: {
    backgroundColor: 'rgba(255, 42, 75, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.5)',
  },
  answerBadgeText: {
    color: '#FF2A4B',
    fontSize: 11,
    fontWeight: '800',
  },
  resetBtn: {
    padding: 4,
  },
  resetBtnText: {
    color: '#8a636c',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#ff94a4',
    fontSize: 12,
    fontWeight: '700',
  },
  answerContent: {
    paddingTop: 2,
  },
  answerBody: {
    color: '#fdf3f5',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    ...KEEP_ALL,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
