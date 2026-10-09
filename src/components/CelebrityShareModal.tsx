import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { CelebrityMatchResult } from '../engine/celebrityEngine';
import type { FiveElement } from '../engine/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  celebrityResult: CelebrityMatchResult | null;
  userDayMaster: string;
}

const STEM_ELEMENT: Record<string, FiveElement> = {
  甲: 'Wood', 乙: 'Wood',
  丙: 'Fire', 丁: 'Fire',
  戊: 'Earth', 己: 'Earth',
  庚: 'Metal', 辛: 'Metal',
  壬: 'Water', 癸: 'Water',
};

const ELEMENT_HANJA: Record<FiveElement, string> = {
  Wood: '木',
  Fire: '火',
  Earth: '土',
  Metal: '金',
  Water: '水',
};

const CARD_RATIO = 9 / 16;
const BUTTON_AREA_HEIGHT = 150;
const SCREEN_PADDING = 16;

function formatToday(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}.${mm}.${dd}`;
}

function buildCoreLine(userDayMaster: string, celebElement: FiveElement | undefined): string {
  const stemElement = STEM_ELEMENT[userDayMaster];
  const left = stemElement ? `${userDayMaster}${ELEMENT_HANJA[stemElement]} 본원` : '나의 본원';
  const right = celebElement ? `${ELEMENT_HANJA[celebElement]} 에너지 공명` : '에너지 공명';
  return `${left} x ${right}`;
}

export function CelebrityShareModal({ visible, onClose, celebrityResult, userDayMaster }: Props) {
  const { width, height } = useWindowDimensions();

  const celebrity = celebrityResult?.matchedCelebrity;
  if (!celebrityResult || !celebrity) {
    return null;
  }

  const maxHeight = Math.max(320, height - BUTTON_AREA_HEIGHT);
  const maxWidth = Math.min(420, Math.max(180, width - SCREEN_PADDING * 2));
  const cardWidth = Math.min(maxWidth, maxHeight * CARD_RATIO);
  const cardHeight = cardWidth / CARD_RATIO;
  const scale = Math.min(1, cardWidth / 320);
  const circleSize = Math.round(124 * scale);
  const syncRate = Math.max(0, Math.min(100, Math.round(celebrityResult.syncRate)));

  const handleShare = () => {
    Alert.alert('안내', '이미지 저장 및 공유 기능 준비 완료!');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { width: cardWidth, height: cardHeight, padding: Math.round(14 * scale) },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              CYBER-SAJU // SOUL FREQUENCY MATRIX
            </Text>
            <Text style={styles.headerDate}>{formatToday()}</Text>
          </View>

          <View style={styles.syncWrap}>
            <View
              style={[
                styles.syncCircle,
                { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
              ]}
            >
              <Text style={styles.syncBolt}>⚡</Text>
              <Text style={[styles.syncValue, { fontSize: Math.round(34 * scale) }]}>{syncRate}%</Text>
              <Text style={styles.syncLabel}>일치율</Text>
            </View>
            <View style={styles.syncTrack}>
              <View style={[styles.syncFill, { width: `${syncRate}%` }]} />
            </View>
          </View>

          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
              {celebrity.name}
            </Text>
            {!!celebrity.title && (
              <Text style={styles.title} numberOfLines={2}>
                {celebrity.title}
              </Text>
            )}
            {!!celebrity.archetype && (
              <View style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>
                  #{celebrity.archetype}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.coreBox}>
            <Text style={styles.coreLabel}>핵심 일치</Text>
            <Text style={styles.coreText}>{buildCoreLine(userDayMaster, celebrity.dominantElement)}</Text>
            {!!celebrityResult.matchReason && (
              <Text style={styles.coreReason}>{celebrityResult.matchReason}</Text>
            )}
          </View>

          {!!celebrity.quote && (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteMark}>❝</Text>
              <Text style={styles.quoteText} numberOfLines={6}>
                {celebrity.quote}
              </Text>
              <Text style={[styles.quoteMark, styles.quoteMarkEnd]}>❞</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerBrand} numberOfLines={1}>
              PROJECT CYBER-SAJU // LOCAL-FIRST EDGE AI
            </Text>
            <Text style={styles.footerCta}>나와 같은 영혼의 인물 찾기</Text>
          </View>
        </View>

        <View style={[styles.buttonRow, { width: cardWidth }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>📲 인스타 스토리에 공유하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#0B1220',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1F293D',
  },
  headerTitle: { color: '#00F0FF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  headerDate: { color: '#55657E', fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  syncWrap: { alignItems: 'center' },
  syncCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.07)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },
  syncBolt: { color: '#BD93F9', fontSize: 14 },
  syncValue: {
    color: '#00F0FF',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 240, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  syncLabel: { color: '#BD93F9', fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  syncTrack: {
    width: '70%',
    height: 4,
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: '#161F33',
    overflow: 'hidden',
  },
  syncFill: { height: '100%', backgroundColor: '#00F0FF', borderRadius: 2 },
  identity: { alignItems: 'center' },
  name: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', textAlign: 'center', maxWidth: '100%' },
  title: { color: '#8B9BB4', fontSize: 12, textAlign: 'center', marginTop: 4 },
  tag: {
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BD93F9',
    backgroundColor: 'rgba(189, 147, 249, 0.1)',
    maxWidth: '100%',
  },
  tagText: { color: '#BD93F9', fontSize: 12, fontWeight: '800' },
  coreBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    alignItems: 'center',
  },
  coreLabel: { color: '#55657E', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  coreText: {
    color: '#00F0FF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 240, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  coreReason: { color: '#B8C4D6', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  quoteBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: '#BD93F9',
    borderRightColor: '#BD93F9',
    backgroundColor: 'rgba(189, 147, 249, 0.08)',
  },
  quoteMark: { color: '#BD93F9', fontSize: 18, lineHeight: 20, fontWeight: '900' },
  quoteMarkEnd: { alignSelf: 'flex-end' },
  quoteText: { color: '#E2D9FA', fontSize: 12, lineHeight: 18, fontStyle: 'italic', textAlign: 'center' },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F293D',
  },
  footerBrand: { color: '#55657E', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  footerCta: { color: '#BD93F9', fontSize: 11, fontWeight: '800', marginTop: 3 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  closeBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#131B2E',
    borderWidth: 1,
    borderColor: '#263859',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#8B9BB4', fontSize: 14, fontWeight: 'bold' },
  shareBtn: {
    flex: 2,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  shareBtnText: { color: '#090D16', fontSize: 14, fontWeight: '900' },
});
