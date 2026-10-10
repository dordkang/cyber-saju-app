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

export interface SijinOption {
  key: string;
  name: string;
  label: string;
  time: string; // HH:mm
}

export const SIJIN_OPTIONS: readonly SijinOption[] = [
  { key: '자시', name: '자시', label: '자시 (23:30 ~ 01:29)', time: '00:30' },
  { key: '축시', name: '축시', label: '축시 (01:30 ~ 03:29)', time: '02:30' },
  { key: '인시', name: '인시', label: '인시 (03:30 ~ 05:29)', time: '04:30' },
  { key: '묘시', name: '묘시', label: '묘시 (05:30 ~ 07:29)', time: '06:30' },
  { key: '진시', name: '진시', label: '진시 (07:30 ~ 09:29)', time: '08:30' },
  { key: '사시', name: '사시', label: '사시 (09:30 ~ 11:29)', time: '10:30' },
  { key: '오시', name: '오시', label: '오시 (11:30 ~ 13:29)', time: '12:30' },
  { key: '미시', name: '미시', label: '미시 (13:30 ~ 15:29)', time: '14:30' },
  { key: '신시', name: '신시', label: '신시 (15:30 ~ 17:29)', time: '16:30' },
  { key: '유시', name: '유시', label: '유시 (17:30 ~ 19:29)', time: '18:30' },
  { key: '술시', name: '술시', label: '술시 (19:30 ~ 21:29)', time: '20:30' },
  { key: '해시', name: '해시', label: '해시 (21:30 ~ 23:29)', time: '22:30' },
];

export interface TargetFormValues {
  relation: string;
  alias: string;
  birthDate: string;
  birthTime: string;
  calendarType: CalendarType;
  gender: Gender;
  targetBirthTime?: string;
  isTimeUnknown?: boolean;
}

interface TargetSettingModalProps {
  visible: boolean;
  onClose: () => void;
  initialValues?: Partial<PartnerProfile> | null;
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
  const [selectedSijinKey, setSelectedSijinKey] = useState<string>('자시');
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    const unknown = Boolean(
      initial?.isTimeUnknown ??
      (initial?.birthTime ? initial.birthTime === BIRTH_TIME_UNKNOWN : false)
    );
    setIsTimeUnknown(unknown);
    setIsDropdownOpen(false);

    if (initial?.birthTime && initial.birthTime !== BIRTH_TIME_UNKNOWN) {
      const found = SIJIN_OPTIONS.find(
        (s) => s.time === initial.birthTime || s.label === initial.targetBirthTime || s.key === initial.targetBirthTime
      );
      if (found) {
        setSelectedSijinKey(found.key);
      } else {
        setSelectedSijinKey('자시');
      }
    } else if (initial?.targetBirthTime && initial.targetBirthTime !== BIRTH_TIME_UNKNOWN) {
      const found = SIJIN_OPTIONS.find((s) => s.key === initial.targetBirthTime || s.label === initial.targetBirthTime);
      setSelectedSijinKey(found?.key ?? '자시');
    } else {
      setSelectedSijinKey('자시');
    }
    setSaving(false);
  }, [visible]);

  const currentSijin = SIJIN_OPTIONS.find((s) => s.key === selectedSijinKey) ?? SIJIN_OPTIONS[0];

  const handleApply = async () => {
    if (saving) return;
    const finalBirthTime = isTimeUnknown ? BIRTH_TIME_UNKNOWN : currentSijin.time;
    const finalTargetBirthTime = isTimeUnknown ? BIRTH_TIME_UNKNOWN : currentSijin.label;

    const error = validateProfileForm(birthDate, finalBirthTime, gender, calendarType);
    if (error || !gender) {
      Alert.alert('입력 확인', error ?? '성별을 선택해 주세요.');
      return;
    }

    const alias = relationLabel(relationKey);
    const values: TargetFormValues = {
      relation: relationKey,
      alias,
      birthDate: birthDate.trim(),
      birthTime: finalBirthTime,
      calendarType,
      gender,
      targetBirthTime: finalTargetBirthTime,
      isTimeUnknown,
    };

    setSaving(true);
    try {
      await savePartnerProfile({
        alias: values.alias,
        relation: values.relation,
        birthDate: values.birthDate,
        birthTime: finalBirthTime,
        calendarType: values.calendarType,
        gender: values.gender,
        targetBirthTime: finalTargetBirthTime,
        isTimeUnknown,
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
          <Text style={styles.caption}>생년월일과 태어난 시간을 입력하면 시주(時柱)까지 정밀하게 스캔합니다.</Text>

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

            {/* 태어난 시간 섹션 */}
            <View style={styles.timeHeaderRow}>
              <Text style={styles.label}>태어난 시간</Text>
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  setIsTimeUnknown((prev) => {
                    const next = !prev;
                    if (next) setIsDropdownOpen(false);
                    return next;
                  });
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTimeUnknown }}
                style={[styles.unknownToggle, isTimeUnknown && styles.unknownToggleOn]}
              >
                <Text style={[styles.unknownCheckText, isTimeUnknown && styles.unknownCheckTextOn]}>
                  {isTimeUnknown ? '☑' : '☐'}
                </Text>
                <Text style={[styles.unknownLabelText, isTimeUnknown && styles.unknownLabelTextOn]}>
                  시간 모름
                </Text>
              </Pressable>
            </View>

            {/* 시진 드롭다운 셀렉터 */}
            <Pressable
              onPress={() => {
                if (isTimeUnknown) return;
                void playHaptic('tap');
                setIsDropdownOpen((prev) => !prev);
              }}
              disabled={isTimeUnknown}
              accessibilityRole="button"
              accessibilityLabel="태어난 시진 선택"
              style={[
                styles.dropdownTrigger,
                !isTimeUnknown && isDropdownOpen && styles.dropdownTriggerOpen,
                isTimeUnknown && styles.dropdownTriggerDisabled,
              ]}
            >
              <Text style={[styles.dropdownValue, isTimeUnknown && styles.dropdownValueDisabled]}>
                {isTimeUnknown ? '시간 미상 (삼주 정밀 분석)' : currentSijin.label}
              </Text>
              <Text style={[styles.dropdownArrow, isTimeUnknown && styles.dropdownArrowDisabled]}>
                {isDropdownOpen && !isTimeUnknown ? '▲' : '▼'}
              </Text>
            </Pressable>

            {/* 드롭다운 옵션 목록 */}
            {isDropdownOpen && !isTimeUnknown && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  {SIJIN_OPTIONS.map((item) => {
                    const isSelected = selectedSijinKey === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          void playHaptic('tap');
                          setSelectedSijinKey(item.key);
                          setIsDropdownOpen(false);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemOn]}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextOn]}>
                          {item.label}
                        </Text>
                        {isSelected && <Text style={styles.dropdownCheckMark}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Text style={styles.timeHint}>
              {isTimeUnknown
                ? '✨ 시간 미상(삼주 정밀 분석)으로 연산이 수행됩니다.'
                : `⚡ ${currentSijin.name} 입력 완료 · 시주(時柱)까지 4주 8자 온전 분석`}
            </Text>

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
    maxHeight: '90%',
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
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  unknownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3144',
    backgroundColor: '#121722',
  },
  unknownToggleOn: {
    borderColor: CRIMSON,
    backgroundColor: 'rgba(255, 51, 102, 0.16)',
  },
  unknownCheckText: {
    color: '#8B97A8',
    fontSize: 14,
    fontWeight: '800',
  },
  unknownCheckTextOn: {
    color: CRIMSON,
  },
  unknownLabelText: {
    color: '#8B97A8',
    fontSize: 12,
    fontWeight: '800',
  },
  unknownLabelTextOn: {
    color: CRIMSON,
  },
  dropdownTrigger: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3144',
    backgroundColor: '#121722',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerOpen: {
    borderColor: CRIMSON,
    backgroundColor: 'rgba(255, 51, 102, 0.08)',
  },
  dropdownTriggerDisabled: {
    opacity: 0.45,
    backgroundColor: '#0D111A',
    borderColor: '#1F2636',
  },
  dropdownValue: {
    color: '#F4F7FB',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownValueDisabled: {
    color: '#6B7A90',
  },
  dropdownArrow: {
    color: '#8A99AD',
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownArrowDisabled: {
    color: '#4B5565',
  },
  dropdownMenu: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.35)',
    backgroundColor: '#0E131F',
    maxHeight: 180,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 49, 68, 0.4)',
  },
  dropdownItemOn: {
    backgroundColor: 'rgba(255, 51, 102, 0.16)',
  },
  dropdownItemText: {
    color: '#C9D3E0',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemTextOn: {
    color: CRIMSON,
    fontWeight: '800',
  },
  dropdownCheckMark: {
    color: CRIMSON,
    fontSize: 14,
    fontWeight: '900',
  },
  timeHint: {
    color: '#7E8B9E',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 4,
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
