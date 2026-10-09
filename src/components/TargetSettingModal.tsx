import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { savePartnerProfile } from '../database/db';
import type { CalendarType, Gender, PartnerProfile } from '../database/db';
import { BIRTH_TIME_UNKNOWN, validateProfileForm } from './ProfileSettingModal';
import { playHaptic } from './reels/haptics';

export interface TargetFormValues {
  relation: string;
  alias: string;
  birthDate: string;
  calendarType: CalendarType;
  gender: Gender;
}

interface TargetSettingModalProps {
  visible: boolean;
  onClose: () => void;
  initialValues?: Partial<Pick<PartnerProfile, 'relation' | 'alias' | 'birthDate' | 'calendarType' | 'gender'>> | null;
  /** DB 저장이 끝난 뒤 호출된다. 예외를 던지면 모달을 유지한다. */
  onApply: (values: TargetFormValues) => void | Promise<void>;
}

const CRIMSON = '#FF3366';
const OBSIDIAN = '#0B0E14';

const TARGET_RELATIONS: readonly { key: string; label: string }[] = [
  { key: '애인', label: '애인' },
  { key: '배우자', label: '배우자' },
  { key: '썸', label: '썸·짝사랑' },
  { key: '비즈니스', label: '비즈니스 동업자' },
];

function relationLabel(key: string): string {
  return TARGET_RELATIONS.find((item) => item.key === key)?.label ?? key;
}

function resolveRelationKey(value: string | null | undefined): string {
  if (!value) return '애인';
  const byKey = TARGET_RELATIONS.find((item) => item.key === value);
  if (byKey) return byKey.key;
  const byLabel = TARGET_RELATIONS.find((item) => item.label === value);
  if (byLabel) return byLabel.key;
  return '애인';
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export const TargetSettingModal: React.FC<TargetSettingModalProps> = ({
  visible,
  onClose,
  initialValues,
  onApply,
}) => {
  const [relationKey, setRelationKey] = useState('애인');
  const [birthDate, setBirthDate] = useState('');
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [gender, setGender] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);

  const initialRef = useRef(initialValues);
  initialRef.current = initialValues;

  useEffect(() => {
    if (!visible) return;
    const initial = initialRef.current;
    setRelationKey(resolveRelationKey(initial?.relation ?? initial?.alias));
    setBirthDate(initial?.birthDate ?? '');
    setCalendarType(initial?.calendarType ?? 'solar');
    setGender(initial?.gender ?? null);
    setSaving(false);
  }, [visible]);

  const handleApply = async () => {
    if (saving) return;
    const error = validateProfileForm(birthDate, BIRTH_TIME_UNKNOWN, gender, calendarType);
    if (error || !gender) {
      Alert.alert('입력 확인', error ?? '성별을 선택해 주세요.');
      return;
    }

    const alias = relationLabel(relationKey);
    const values: TargetFormValues = {
      relation: relationKey,
      alias,
      birthDate: birthDate.trim(),
      calendarType,
      gender,
    };

    setSaving(true);
    try {
      await savePartnerProfile({
        alias: values.alias,
        relation: values.relation,
        birthDate: values.birthDate,
        birthTime: BIRTH_TIME_UNKNOWN,
        calendarType: values.calendarType,
        gender: values.gender,
      });
      await playHaptic('tap');
      await onApply(values);
      // 웹에서 같은 포인터가 아래 카드 CTA로 새어 나가지 않도록 한 박자 뒤에 닫는다.
      setTimeout(() => onClose(), 180);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 오류', `상대 정보를 저장하지 못했습니다. ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="닫기" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>대상 설정</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.caption}>생년월일만 있으면 속마음 레이더를 바로 돌립니다. 시간은 모름으로 둡니다.</Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            <Text style={styles.label}>관계</Text>
            <View style={styles.chipRow}>
              {TARGET_RELATIONS.map((item) => {
                const selected = relationKey === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setRelationKey(item.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>상대 생년월일 8자리</Text>
            <TextInput
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDateInput(text))}
              placeholder="예: 19751229"
              placeholderTextColor="#55657E"
              keyboardType="number-pad"
              maxLength={10}
              autoComplete="off"
              style={styles.input}
              accessibilityLabel="상대 생년월일"
            />

            <Text style={styles.label}>달력</Text>
            <View style={styles.chipRow}>
              {(
                [
                  { key: 'solar', label: '양력' },
                  { key: 'lunar', label: '음력' },
                ] as const
              ).map((item) => {
                const selected = calendarType === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setCalendarType(item.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>성별</Text>
            <View style={styles.chipRow}>
              {(
                [
                  { key: 'male', label: '남' },
                  { key: 'female', label: '여' },
                ] as const
              ).map((item) => {
                const selected = gender === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setGender(item.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleApply}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            style={({ pressed }) => [styles.apply, saving && styles.applyBusy, pressed && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color={OBSIDIAN} />
            ) : (
              <Text style={styles.applyText}>적용 및 속마음 스캔</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  dismiss: { flex: 1 },
  sheet: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    maxHeight: '88%',
    backgroundColor: OBSIDIAN,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 51, 102, 0.45)',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A3144',
    marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: CRIMSON, fontSize: 18, fontWeight: '900' },
  close: { color: '#8A99AD', fontSize: 20, fontWeight: '700', padding: 4 },
  caption: { color: '#8B97A8', fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 4 },
  body: { paddingTop: 8, paddingBottom: 12, gap: 8 },
  label: { color: '#C9D3E0', fontSize: 12, fontWeight: '800', marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A3144',
    backgroundColor: '#121722',
  },
  chipOn: { borderColor: CRIMSON, backgroundColor: 'rgba(255, 51, 102, 0.16)' },
  chipText: { color: '#8B97A8', fontSize: 13, fontWeight: '800' },
  chipTextOn: { color: CRIMSON },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3144',
    backgroundColor: '#121722',
    color: '#F4F7FB',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  apply: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CRIMSON,
  },
  applyBusy: { opacity: 0.65 },
  applyText: { color: '#F4F7FB', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
