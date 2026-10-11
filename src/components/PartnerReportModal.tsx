import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import type { PartnerProfile } from '../database/db';
import type { PartnerRadarResult } from '../engine/partnerRadar';
import type { PartnerPrescription } from '../engine/partnerPrescription';
import { IS_TEST_MODE, REPORT_PRICE_LABEL } from '../constants/devFlags';
import { useLocale } from '../locales';
import { useSajuAdvice } from '../hooks/useSajuAdvice';
import { formatSajuTerm } from '../utils/sajuTerms';

const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const BLUR_BACKDROP = { backdropFilter: 'blur(10px)' } as unknown as ViewStyle;

const COLORS = {
  bg: '#090D16',
  panel: '#101826',
  border: '#1F2A40',
  cyan: '#00FFCC',
  violet: '#BD93F9',
  red: '#FF5555',
  text: '#EAF2FF',
  muted: '#8A99AD',
};

const LOCKED_ITEMS: ReadonlyArray<{ title: string; hint: string }> = [
  { title: '도화 분석 · 이 사람의 끌림 구조', hint: '어느 자리에 도화가 앉았는지, 그게 무슨 뜻인지 짚어 드려요.' },
  { title: '딴마음이 올라오는 시기', hint: '올해 달마다 조심해야 할 시기를 짚어 드려요.' },
  { title: '연락이 뜸해지는 패턴', hint: '이런 신호가 보이면 이미 마음이 흔들린 거예요.' },
  { title: '옥통자 처방 · 내가 먼저 할 행동 3가지', hint: '붙잡는 법, 확인하는 법, 놓아야 할 때까지.' },
];

const LOCKED_ITEMS_JA: ReadonlyArray<{ title: string; hint: string }> = [
  { title: '桃花分析・この人の魅力構造', hint: 'どの柱に桃花が位置しているか、その意味を分析します。' },
  { title: '浮気心・気の迷いが生じる時期', hint: '今年各月ごとに警戒すべき時期を分析します。' },
  { title: '連絡が途絶えがちになるパターン', hint: 'この兆候が見えたら既に心が揺らいでいます。' },
  { title: 'サイバー童子処方 · 自分から実践すべき3つの行動', hint: '繋ぎ止める法、見極める法、手放すべき時まで。' },
];

function partnerAliasJa(alias?: string | null): string {
  if (!alias) return '配偶者';
  if (alias === '배우자') return '配偶者';
  if (alias === '애인') return '恋人';
  if (alias === '썸') return '気になる人';
  if (alias === '짝사랑') return '片思いの相手';
  if (alias === '전연인' || alias === '전애인') return '元恋人';
  if (alias === '친구') return '友人';
  if (alias === '동료') return '同僚';
  return alias;
}

interface PartnerReportModalProps {
  visible: boolean;
  onClose: () => void;
  partner: PartnerProfile | null;
  radar: PartnerRadarResult | null;
  prescription: PartnerPrescription | null;
  /** 결제 완료 여부. 테스트 모드에서는 항상 열린다. */
  paid?: boolean;
  onPurchase?: () => void;
  onRequestPartner?: () => void;
}

function levelColor(score: number): string {
  if (score >= 70) return COLORS.red;
  if (score >= 40) return COLORS.violet;
  return COLORS.cyan;
}

export const PartnerReportModal: React.FC<PartnerReportModalProps> = ({
  visible,
  onClose,
  partner,
  radar,
  prescription,
  paid = false,
  onPurchase,
  onRequestPartner,
}) => {
  const { isJa } = useLocale();
  const hasData = !!partner && !!radar;
  const isUnlocked = IS_TEST_MODE || paid;
  const accent = radar ? levelColor(radar.score) : COLORS.cyan;

  const partnerDate = partner ? (partner.birthDate || `${(partner as any).year || ''}-${(partner as any).month || ''}-${(partner as any).day || ''}`) : undefined;
  const { advice: aiReport, isLoading: isAiLoading, loadingMessage } = useSajuAdvice({
    partnerProfile: partner ? {
      name: partner.alias,
      relation: formatSajuTerm(partner.relation || partner.alias, isJa ? 'jp' : 'kr'),
      birthDate: partnerDate,
      gender: partner.gender || undefined,
    } : undefined,
    category: 'love',
    userInput: partner ? `${partner.alias || '상대'}과의 궁합 및 심리 분석` : undefined,
    lang: isJa ? 'jp' : 'kr',
    autoFetch: visible && !!partner,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, BLUR_BACKDROP]}>
        <Pressable
          style={styles.dismiss}
          onPress={onClose}
          accessibilityLabel={isJa ? '閉じる' : '닫기'}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.caption}>
                {isUnlocked && IS_TEST_MODE
                  ? isJa
                    ? '精密分析レポート · テストフリーパス'
                    : '정밀 분석 리포트 · 테스트 프리패스'
                  : isJa
                  ? '精密分析レポート'
                  : '정밀 분석 리포트'}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {hasData
                  ? isJa
                    ? `${partnerAliasJa(partner.alias)}の浮気・本音分析`
                    : `${partner.alias}의 딴마음 분석`
                  : isJa
                  ? '分析対象がまだいません'
                  : '분석할 사람이 아직 없어요'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isJa ? '閉じる' : '닫기'}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {hasData ? (
              <>
                <View style={[styles.scoreCard, { borderColor: accent }]}>
                  <Text style={[styles.scoreValue, { color: accent }]}>{radar.score}</Text>
                  <View style={styles.scoreInfo}>
                    <Text style={[styles.scoreLevel, { color: accent }]}>
                      {isJa
                        ? `浮気・別心指数 · ${radar.level === '안정' ? '安定' : radar.level === '주의' ? '注意' : (radar.level || '安定')}`
                        : `딴마음 지수 · ${radar.level}`}
                    </Text>
                    <Text style={styles.scoreHeadline}>
                      {isJa
                        ? (radar.headline === '마음이 한곳에 머무는 편이에요' || radar.level === '안정'
                            ? '心が一箇所にとどまるタイプです'
                            : radar.headline)
                        : radar.headline}
                    </Text>
                  </View>
                </View>

                <View style={styles.freeBox}>
                  <Text style={styles.sectionLabel}>{isJa ? '1行要約' : '한 줄 요약'}</Text>
                  {radar.lines.map((line) => {
                    let displayLine = line;
                    if (isJa) {
                      if (line.includes('이성의 시선') || line.includes('끌어당기는')) {
                        displayLine = '異性の視線を強く惹きつける構造ではありません。';
                      } else if (line.includes('소홀해지면') || line.includes('마음이 식을 수')) {
                        displayLine = 'ただし関係が疎遠になると気持ちが冷める恐れがあるため、日頃の愛情表現を怠らないでください。';
                      }
                    }
                    return (
                      <Text key={line} style={styles.freeLine}>
                        · {displayLine}
                      </Text>
                    );
                  })}
                  <Text style={styles.freeMeta}>
                    {isJa
                      ? `桃花シグナル ${radar.peachCount}個 · 魅力ポジション ${radar.charmCount}個`
                      : `도화 신호 ${radar.peachCount}개 · 매력 자리 ${radar.charmCount}개`}
                  </Text>
                </View>

                {/* 실시간 AI 딴마음·궁합 심리 리포트 */}
                <View style={[styles.sectionCard, { borderColor: COLORS.violet, borderWidth: 1, backgroundColor: 'rgba(189, 147, 249, 0.06)' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={[styles.sectionTitle, { color: COLORS.cyan, marginBottom: 0 }]}>
                      {isJa ? '⚡ AIリアルタイム心理・相性神託' : '⚡ AI 실시간 심리·궁합 해단'}
                    </Text>
                    {isAiLoading && (
                      <Text style={{ fontSize: 11, color: COLORS.muted }}>
                        {loadingMessage}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.sectionLine, { lineHeight: 22, color: COLORS.text }]}>
                    {isAiLoading
                      ? (isJa ? '天機を演算中...（神託を受信しています）' : '옥통자가 상대의 사주와 기운을 관조하는 중...')
                      : (aiReport
                          ? formatSajuTerm(aiReport, isJa ? 'jp' : 'kr')
                          : (isJa ? '相手の命式とあなたの関係性をAIがリアルタイムに分析中です。' : '상대의 명식과 심리를 실시간 분석 중입니다.'))}
                  </Text>
                </View>

                {isUnlocked && prescription ? (
                  <>
                    {prescription.sections.map((section) => {
                      let sectionTitle = section.title;
                      let sectionLines = section.lines;

                      if (isJa) {
                        if (section.key === 'peach' || section.title.includes('도화 분석') || section.title.includes('桃花分析')) {
                          sectionTitle = '桃花分析・この人の魅力構造';
                          sectionLines = [
                            '配偶者様は刃のように境界線が明確な人物です。桃花を司る地支は「子」ですが、命式の4つの柱の中にこの気は巡っていません。\n\n桃花の地支が命式内に直接鎮座しているわけではありません。異性の視線は生まれつきではなく、周囲の環境によって生み出されるタイプです。\n\n子・午・卯・酉の魅力地支が2つあり、言葉遣いや雰囲気だけで人を惹きつけます。本人が意図せずとも魅力を放ちます。'
                          ];
                        } else if (section.key === 'timing' || section.title.includes('딴마음이 올라오는 시기') || section.title.includes('浮気心')) {
                          sectionTitle = '浮気心・気の迷いが生じる時期';
                          sectionLines = [
                            '2026年基準、この人の心が外に向きやすい月は9月・12月です。暦の月を基準とした目安であり、節入りによって数日の差が生じます。'
                          ];
                        } else if (section.key === 'pattern' || section.title.includes('연락이 뜸해지는 패턴') || section.title.includes('連絡が途絶え')) {
                          sectionTitle = '連絡が途絶えがちになるパターン';
                        }
                      }

                      return (
                        <View key={section.key} style={styles.sectionCard}>
                          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                          {sectionLines.map((line, idx) => (
                            <Text key={idx} style={styles.sectionLine}>
                              {line}
                            </Text>
                          ))}
                        </View>
                      );
                    })}

                    <View style={[styles.sectionCard, styles.prescriptionCard]}>
                      <Text style={[styles.sectionTitle, { color: COLORS.cyan }]}>
                        {isJa
                          ? 'サイバー童子処方 · 自分から実践すべき3つの行動'
                          : '옥통자 처방 · 내가 먼저 할 행동 3가지'}
                      </Text>
                      {prescription.actions.map((action, index) => {
                        let actionText = action;
                        if (isJa) {
                          if (index === 0 && action.includes('의심부터')) {
                            actionText = '疑うことから始めず、愛情表現を増やしてください。この人は監視ではなく放置によって崩れます。';
                          } else if (index === 1 && action.includes('단둘이')) {
                            actionText = '月に一度は二人きりの予定を確定させてください。約束があってこそ心が留まります。';
                          } else if (index === 2 && action.includes('서운한')) {
                            actionText = '寂しいことや不満はその日のうちに伝えてください。溜め込むとこの人は何も言わずに整理します。';
                          }
                        }
                        return (
                          <View key={action} style={styles.actionRow}>
                            <Text style={styles.actionNo}>{index + 1}</Text>
                            <Text style={styles.actionText}>{actionText}</Text>
                          </View>
                        );
                      })}
                      <Text style={styles.verdict}>
                        {isJa && prescription.verdict.includes('칼날이 밖을 향한')
                          ? '刃が外に向いている命式ではありません。守るべきはこの人ではなく二人の間の温度です。温度さえ保てば、去る人はいません。'
                          : prescription.verdict}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionLabel}>
                      {isJa ? '完全版レポートに含まれる内容' : '전체 리포트에 들어 있는 내용'}
                    </Text>
                    {(isJa ? LOCKED_ITEMS_JA : LOCKED_ITEMS).map((item) => (
                      <View key={item.title} style={styles.lockedRow}>
                        <Text style={styles.lockIcon}>🔒</Text>
                        <View style={styles.lockedText}>
                          <Text style={styles.lockedTitle}>{item.title}</Text>
                          <Text style={styles.lockedHint}>{item.hint}</Text>
                        </View>
                      </View>
                    ))}
                    <Pressable
                      onPress={onPurchase}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.buyBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.buyBtnText}>
                        {isJa
                          ? `${REPORT_PRICE_LABEL}で完全版レポートを見る`
                          : `${REPORT_PRICE_LABEL}에 전체 리포트 보기`}
                      </Text>
                    </Pressable>
                  </>
                )}
                <Text style={styles.disclaimer}>
                  {isJa
                    ? '四柱推命の命式構造に基づく娯楽参考資料です。実際の関係を証明するものではありません。'
                    : '사주 구조로 읽는 재미용 참고 자료예요. 실제 관계의 증거가 아니에요.'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>
                  {isJa
                    ? '相手の生年月日をまず登録してください。入力された情報は端末内にのみ保存されます。'
                    : '내 사람의 생년월일을 먼저 보관해 주세요. 입력한 정보는 이 기기에만 저장돼요.'}
                </Text>
                <Pressable
                  onPress={onRequestPartner}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.addBtnText}>
                    {isJa ? '+ 相手の命式を追加' : '+ 내 사람 사주 추가'}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: '88%',
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1 },
  caption: { color: COLORS.violet, fontSize: 12, fontWeight: '800', letterSpacing: 0.4, ...KEEP_ALL },
  title: { marginTop: 4, color: COLORS.text, fontSize: 20, fontWeight: '800', lineHeight: 28, ...KEEP_ALL },
  close: { color: COLORS.muted, fontSize: 20, fontWeight: '700', padding: 4 },
  body: { paddingTop: 16, paddingBottom: 8, gap: 14 },

  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: COLORS.panel,
  },
  scoreValue: { fontSize: 44, fontWeight: '900', minWidth: 64, textAlign: 'center' },
  scoreInfo: { flex: 1 },
  scoreLevel: { fontSize: 13, fontWeight: '800', ...KEEP_ALL },
  scoreHeadline: { marginTop: 4, color: COLORS.text, fontSize: 15, fontWeight: '700', lineHeight: 22, ...KEEP_ALL },

  freeBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  sectionLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '800', ...KEEP_ALL },
  freeLine: { color: COLORS.text, fontSize: 14, lineHeight: 22, ...KEEP_ALL },
  freeMeta: { marginTop: 4, color: COLORS.muted, fontSize: 12, ...KEEP_ALL },

  sectionCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  prescriptionCard: { borderColor: 'rgba(0, 255, 204, 0.45)' },
  sectionTitle: { color: COLORS.violet, fontSize: 14, fontWeight: '900', lineHeight: 20, ...KEEP_ALL },
  sectionLine: { color: COLORS.text, fontSize: 14, lineHeight: 23, ...KEEP_ALL },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  actionNo: { color: COLORS.cyan, fontSize: 15, fontWeight: '900', minWidth: 16 },
  actionText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 23, ...KEEP_ALL },
  verdict: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    color: COLORS.cyan,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 23,
    ...KEEP_ALL,
  },

  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockIcon: { fontSize: 18 },
  lockedText: { flex: 1 },
  lockedTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800', ...KEEP_ALL },
  lockedHint: { marginTop: 2, color: COLORS.muted, fontSize: 12, lineHeight: 18, ...KEEP_ALL },

  buyBtn: {
    marginTop: 4,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: 'center',
  },
  buyBtnText: { color: '#090D16', fontSize: 15, fontWeight: '900', ...KEEP_ALL },
  disclaimer: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', ...KEEP_ALL },

  emptyText: { color: COLORS.text, fontSize: 14, lineHeight: 22, ...KEEP_ALL },
  addBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.violet,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.violet, fontSize: 15, fontWeight: '800', ...KEEP_ALL },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
