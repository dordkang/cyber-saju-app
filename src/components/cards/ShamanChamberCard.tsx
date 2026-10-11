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

  // 실시간 AI 훅 연동
  const {
    advice: aiAdvice,
    isLoading: isAiLoading,
    loadingMessage,
    refetch: fetchAiAdvice,
  } = useSajuAdvice({
    saju,
    userProfile,
    category: 'chamber_oracle',
    userInput: questionText,
    lang: isJa ? 'jp' : 'kr',
    autoFetch: false,
  });

  // 카테고리 칩 선택 핸들러
  const handleSelectQuestion = (q: ChamberQuestion) => {
    void playHaptic('tap');
    setSelectedQuestionId(q.id);
    setQuestionText(isJa ? q.jp : q.kr);
  };

  // 즉문즉답 전송 핸들러
  const handleSubmit = async () => {
    if (!questionText.trim()) return;
    void playHaptic('snap');
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
    if (isJa) {
      return `【サイバー神童・天機直説】\n「お前の生まれ持った日干『${day}』の気運を見るに、盤勢は既に臨界点に達している。小細工や迷いで逃げ道を塞ぐな。今はお前が主導権を握り、妥協を拒絶して自らの盤面を切り開くべき刻限だ。情に流されて優柔不断を晒せば、その隙を突かれて全てを奪われる。刃を研ぎ澄まし、即座に決断せよ。」`;
    }
    return `【옥동자 신명직설(神明直說)】\n「네 타고난 일간 '${day}'의 기운과 사주 원국을 해부해 보니, 판세는 이미 벼랑 끝 변곡점에 닿아 있다. 잔머리 굴리며 간 보지 마라. 지금은 남 눈치 보며 맞춰줄 때가 아니라, 네가 먼저 밥상을 엎고 칼자루를 쥐어야 살아남는 국면이다. 썩은 인연과 미련을 가차 없이 도려내고 단도직입으로 쐐기를 박아라!」`;
  }, [saju?.dayMaster, isJa]);

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
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 40,
          },
        ]}
      >
        {/* 1. 상단 헤더 */}
        <View style={styles.header}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {isJa ? '08 · 密室相談' : '08 · 밀실 상담'}
            </Text>
          </View>
          <Text style={styles.title}>
            {isJa ? 'サイバー神童 1:1 天機密室' : '옥동자 1:1 천기 밀실'}
          </Text>
          <Text style={styles.subtitle}>
            {isJa
              ? '建前を捨て、最も切迫した悩みを吐き出せ。400字の一刀両断で盤勢を解断する。'
              : '체면을 벗고 가장 처절한 근심을 털어놓아라. 400자 단도직입으로 판세를 짚는다.'}
          </Text>
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
                    {q.category}
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
            disabled={isAiLoading || !questionText.trim()}
            style={({ pressed }) => [
              styles.submitBtn,
              CRIMSON_SHADOW,
              (!questionText.trim() || isAiLoading) && styles.submitBtnDisabled,
              pressed && styles.pressed,
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
            ) : (
              <Text style={styles.submitBtnText}>
                {isJa
                  ? '⚡ サイバー神童の即問即答 (400字神託)'
                  : '⚡ 옥동자 신명 즉문즉답 (400자 팩폭)'}
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
