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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="닫기" />
        <View style={[styles.sheet, SHEET_BLUR]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ 설정</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <MenuRow icon="🧭" title="사주 프로필 재설정" caption="생년월일시 · 성별 · 양력/음력 다시 입력" onPress={onOpenProfile} />
          <MenuRow icon="💾" title="1초 로컬 백업 · 복원" caption="서버 없이 이 기기 데이터를 꺼내고 되살리기" onPress={onOpenBackup} />
          <MenuRow icon="🎙️" title="도사 말투 바꾸기" caption={`지금은 ${personaLabel}`} onPress={onOpenPersona} />

          <View style={styles.row}>
            <Text style={styles.rowIcon}>{soundOn ? '🔊' : '🔇'}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>오행 힐링 사운드</Text>
              <Text style={styles.rowCaption} numberOfLines={1}>
                {soundOn ? '432Hz 배경음이 흐르는 중' : '432Hz 배경음 꺼짐'}
              </Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={onToggleSound}
              trackColor={{ false: '#2A3350', true: 'rgba(0, 255, 204, 0.55)' }}
              thumbColor={soundOn ? '#00FFCC' : '#8A99AD'}
              accessibilityLabel="오행 힐링 사운드 켜기 끄기"
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
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
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
