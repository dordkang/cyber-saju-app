import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import type { PartnerProfile } from '../database/db';
import type { PartnerRadarResult } from '../engine/partnerRadar';
import type { PartnerPrescription } from '../engine/partnerPrescription';
import { IS_TEST_MODE, REPORT_PRICE_LABEL } from '../constants/devFlags';

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
  { title: '옥동자 처방 · 내가 먼저 할 행동 3가지', hint: '붙잡는 법, 확인하는 법, 놓아야 할 때까지.' },
];

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
  const hasData = !!partner && !!radar;
  const isUnlocked = IS_TEST_MODE || paid;
  const accent = radar ? levelColor(radar.score) : COLORS.cyan;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, BLUR_BACKDROP]}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="닫기" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.caption}>
                {isUnlocked && IS_TEST_MODE ? '정밀 분석 리포트 · 테스트 프리패스' : '정밀 분석 리포트'}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {hasData ? `${partner.alias}의 딴마음 분석` : '분석할 사람이 아직 없어요'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {hasData ? (
              <>
                <View style={[styles.scoreCard, { borderColor: accent }]}>
                  <Text style={[styles.scoreValue, { color: accent }]}>{radar.score}</Text>
                  <View style={styles.scoreInfo}>
                    <Text style={[styles.scoreLevel, { color: accent }]}>딴마음 지수 · {radar.level}</Text>
                    <Text style={styles.scoreHeadline}>{radar.headline}</Text>
                  </View>
                </View>

                <View style={styles.freeBox}>
                  <Text style={styles.sectionLabel}>한 줄 요약</Text>
                  {radar.lines.map((line) => (
                    <Text key={line} style={styles.freeLine}>
                      · {line}
                    </Text>
                  ))}
                  <Text style={styles.freeMeta}>
                    도화 신호 {radar.peachCount}개 · 매력 자리 {radar.charmCount}개
                  </Text>
                </View>

                {isUnlocked && prescription ? (
                  <>
                    {prescription.sections.map((section) => (
                      <View key={section.key} style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.lines.map((line) => (
                          <Text key={line} style={styles.sectionLine}>
                            {line}
                          </Text>
                        ))}
                      </View>
                    ))}

                    <View style={[styles.sectionCard, styles.prescriptionCard]}>
                      <Text style={[styles.sectionTitle, { color: COLORS.cyan }]}>옥동자 처방 · 내가 먼저 할 행동 3가지</Text>
                      {prescription.actions.map((action, index) => (
                        <View key={action} style={styles.actionRow}>
                          <Text style={styles.actionNo}>{index + 1}</Text>
                          <Text style={styles.actionText}>{action}</Text>
                        </View>
                      ))}
                      <Text style={styles.verdict}>{prescription.verdict}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionLabel}>전체 리포트에 들어 있는 내용</Text>
                    {LOCKED_ITEMS.map((item) => (
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
                      <Text style={styles.buyBtnText}>{REPORT_PRICE_LABEL}에 전체 리포트 보기</Text>
                    </Pressable>
                  </>
                )}
                <Text style={styles.disclaimer}>사주 구조로 읽는 재미용 참고 자료예요. 실제 관계의 증거가 아니에요.</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>
                  내 사람의 생년월일을 먼저 보관해 주세요. 입력한 정보는 이 기기에만 저장돼요.
                </Text>
                <Pressable
                  onPress={onRequestPartner}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.addBtnText}>+ 내 사람 사주 추가</Text>
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
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
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
