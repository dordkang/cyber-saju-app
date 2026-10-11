import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

interface SettingsMenuModalProps {
  visible: boolean;
  onClose: () => void;
  /** 현재 선택된 도사 이름. 예: "⚡ 단칼의 직언" */
  personaLabel: string;
  soundOn: boolean;
  onOpenProfile: () => void;
  onOpenBackup: () => void;
  onOpenPersona: () => void;
  onToggleSound: (next: boolean) => void;
}

const SHEET_BLUR = (
  Platform.OS === 'web' ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } : null
) as unknown as ViewStyle | null;

interface RowProps {
  icon: string;
  title: string;
  caption: string;
  onPress: () => void;
}

function MenuRow({ icon, title, caption, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCaption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

import { useLocale } from '../locales';

export const SettingsMenuModal: React.FC<SettingsMenuModalProps> = ({
  visible,
  onClose,
  personaLabel,
  soundOn,
  onOpenProfile,
  onOpenBackup,
  onOpenPersona,
  onToggleSound,
}) => {
  const { isJa } = useLocale();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel={isJa ? '閉じる' : '닫기'} />
        <View style={[styles.sheet, SHEET_BLUR]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{isJa ? '⚙️ 設定' : '⚙️ 설정'}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={isJa ? '閉じる' : '닫기'}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <MenuRow
            icon="🧭"
            title={isJa ? '命式プロフィールの再設定' : '사주 프로필 재설정'}
            caption={isJa ? '生年月日・出生時刻・性別・暦を再入力' : '생년월일시 · 성별 · 양력/음력 다시 입력'}
            onPress={onOpenProfile}
          />
          <MenuRow
            icon="💾"
            title={isJa ? 'ローカルバックアップ・復元' : '1초 로컬 백업 · 복원'}
            caption={
              isJa
                ? 'キャッシュ削除や機種変更に備え、命式データを安全に保管・復元します。'
                : '스마트폰 변경이나 캐시 삭제에 대비해 내 사주 데이터를 안전하게 보관합니다.'
            }
            onPress={onOpenBackup}
          />
          <MenuRow
            icon="🎙️"
            title={isJa ? '道士の口調変更' : '도사 말투 바꾸기'}
            caption={isJa ? `現在は ${personaLabel}` : `지금은 ${personaLabel}`}
            onPress={onOpenPersona}
          />

          <View style={styles.row}>
            <Text style={styles.rowIcon}>{soundOn ? '🔊' : '🔇'}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {isJa ? '神秘アンビエント瞑想音 (東洋五音階オルゴール)' : '신명 앰비언트 명상음 (동양 오음계 오르골)'}
              </Text>
              <Text style={styles.rowCaption} numberOfLines={1}>
                {isJa
                  ? (soundOn ? '東洋五音階オルゴール瞑想音が再生中' : 'アンビエント瞑想音OFF')
                  : (soundOn ? '동양 오음계 오르골 명상음이 흐르는 중' : '명상 배경음 꺼짐')}
              </Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={onToggleSound}
              trackColor={{ false: '#2A3350', true: 'rgba(0, 255, 204, 0.55)' }}
              thumbColor={soundOn ? '#00FFCC' : '#8A99AD'}
              accessibilityLabel={isJa ? '神秘アンビエント瞑想音切り替え' : '신명 앰비언트 명상음 켜기 끄기'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  dismiss: { flex: 1 },
  sheet: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    backgroundColor: 'rgba(9, 13, 22, 0.88)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(0, 255, 204, 0.28)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 8,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#1F2A40', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 },
  title: { color: '#00FFCC', fontSize: 16, fontWeight: '900' },
  close: { color: '#8A99AD', fontSize: 20, fontWeight: '700', padding: 4 },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  rowIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: '#F2F6FF', fontSize: 15, fontWeight: '800' },
  rowCaption: { color: '#9AA8BD', fontSize: 12 },
  chevron: { color: '#00FFCC', fontSize: 22, fontWeight: '700' },
});
