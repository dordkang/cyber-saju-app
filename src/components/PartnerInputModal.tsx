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
import { PARTNER_RELATIONS, savePartnerProfile } from '../database/db';
import type { CalendarType, Gender, PartnerProfile, PartnerRelation } from '../database/db';
import { BIRTH_TIME_UNKNOWN, validateProfileForm } from './ProfileSettingModal';

export type PartnerFormValues = Omit<PartnerProfile, 'id' | 'createdAt'>;

interface PartnerInputModalProps {
  visible: boolean;
  onClose: () => void;
  /** 저장된 상대방 정보. 있으면 [변경] 용도로 폼을 채운다. */
  initialValues?: Partial<PartnerFormValues> | null;
  /** DB 저장이 끝난 뒤 호출된다. 예외를 던지면 오류를 안내한다. */
  onSaved: (values: PartnerFormValues) => void | Promise<void>;
  /** [생년월일 모름] 스킵 시 모달을 닫기 전에 호출된다. */
  onSkip?: () => void;
}

const DEFAULT_RELATION: PartnerRelation = '애인';

function isPartnerRelation(value: unknown): value is PartnerRelation {
  return typeof value === 'string' && (PARTNER_RELATIONS as readonly string[]).includes(value);
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export const PartnerInputModal: React.FC<PartnerInputModalProps> = ({
  visible,
  onClose,
  initialValues,
  onSaved,
  onSkip,
}) => {
  const [relation, setRelation] = useState<PartnerRelation>(DEFAULT_RELATION);
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [saving, setSaving] = useState(false);

  const initialRef = useRef(initialValues);
  initialRef.current = initialValues;

  // 모달이 열릴 때만 폼을 채워, 입력 중 부모 리렌더로 값이 초기화되지 않게 한다.
  useEffect(() => {
    if (!visible) return;
    const initial = initialRef.current;
    const savedTime = initial?.birthTime ?? '';
    setRelation(isPartnerRelation(initial?.relation) ? initial.relation : DEFAULT_RELATION);
    setGender(initial?.gender ?? null);
    setBirthDate(initial?.birthDate ?? '');
    setTimeUnknown(savedTime === BIRTH_TIME_UNKNOWN);
    setBirthTime(savedTime === BIRTH_TIME_UNKNOWN ? '' : savedTime);
    setCalendarType(initial?.calendarType ?? 'solar');
    setSaving(false);
  }, [visible]);

  const handleSave = async () => {
    if (saving) return;
    const finalTime = timeUnknown ? BIRTH_TIME_UNKNOWN : birthTime.trim();
    const error = validateProfileForm(birthDate, finalTime, gender, calendarType);
    if (error || !gender) {
      Alert.alert('입력 확인', error ?? '성별을 선택해 주세요.');
      return;
    }

    const values: PartnerFormValues = {
      alias: relation,
      gender,
      birthDate: birthDate.trim(),
      birthTime: finalTime,
      calendarType,
      relation,
    };

    setSaving(true);
    try {
      await savePartnerProfile(values);
      await onSaved(values);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 오류', `상대방 정보 저장 실패: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (saving) return;
    onSkip?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBox}>
          <Text style={styles.title}>🔮 그 사람의 무의식 주파수 동기화</Text>
          <Text style={styles.subtitle}>
            상대의 생년월일을 교차해 속마음과 바람기 주파수를 투시합니다.{'\n'}입력한 정보는 이 기기에만 저장됩니다.
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>관계 호칭</Text>
            <View style={styles.chipWrap}>
              {PARTNER_RELATIONS.map((item) => {
                const selected = relation === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setRelation(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.relationChip, selected && styles.chipSelectedPurple]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextPurple]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>성별</Text>
            <View style={styles.segment}>
              {(
                [
                  ['male', '남성'],
                  ['female', '여성'],
                ] as const
              ).map(([key, text]) => (
                <Pressable
                  key={key}
                  onPress={() => setGender(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: gender === key }}
                  style={[styles.segmentItem, gender === key && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, gender === key && styles.chipTextSelected]}>{text}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>생년월일</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDateInput(text))}
              placeholder="예) 1990-01-31"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={10}
              autoCorrect={false}
            />

            <Text style={styles.label}>태어난 시간</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput, timeUnknown && styles.inputDisabled]}
                value={timeUnknown ? '' : birthTime}
                onChangeText={(text) => setBirthTime(formatTimeInput(text))}
                placeholder={timeUnknown ? '시간 모름' : 'HH:mm'}
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                maxLength={5}
                editable={!timeUnknown}
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setTimeUnknown((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: timeUnknown }}
                style={[styles.checkChip, timeUnknown && styles.chipSelected]}
              >
                <Text style={[styles.checkMark, timeUnknown && styles.chipTextSelected]}>
                  {timeUnknown ? '☑' : '☐'}
                </Text>
                <Text style={[styles.chipText, timeUnknown && styles.chipTextSelected]}>시간 모름</Text>
              </Pressable>
            </View>
            {timeUnknown && (
              <Text style={styles.hint}>시간을 모르면 정오(12:00) 기준으로 계산합니다. 일간·일지 분석에는 영향이 거의 없습니다.</Text>
            )}

            <Text style={styles.label}>달력</Text>
            <View style={styles.segment}>
              {(
                [
                  ['solar', '양력'],
                  ['lunar', '음력'],
                ] as const
              ).map(([key, text]) => (
                <Pressable
                  key={key}
                  onPress={() => setCalendarType(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: calendarType === key }}
                  style={[styles.segmentItem, calendarType === key && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, calendarType === key && styles.chipTextSelected]}>
                    {text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.saveBtn,
              saving && styles.saveBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#090D16" />
            ) : (
              <Text style={styles.saveBtnText}>⚡ 운명 동기화 및 저장</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleSkip}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
          >
            <Text style={styles.skipBtnText}>생년월일 모름 - 타로 무의식 투사로 계속</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    maxHeight: '94%',
    backgroundColor: '#0F0B1E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BD93F9',
    shadowColor: '#BD93F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    color: '#BD93F9',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(189, 147, 249, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: '#8B9BB4',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },
  label: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relationChip: {
    minHeight: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F293D',
    backgroundColor: '#131B2E',
  },
  input: {
    minHeight: 44,
    backgroundColor: '#0D1424',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3F66',
    color: '#E6EDF3',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputDisabled: { opacity: 0.4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1 },
  checkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F293D',
    backgroundColor: '#131B2E',
  },
  checkMark: { color: '#8B9BB4', fontSize: 16 },
  hint: { color: '#55657E', fontSize: 10, lineHeight: 14, marginTop: 6 },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F293D',
    backgroundColor: '#131B2E',
  },
  chipSelected: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  chipSelectedPurple: {
    borderColor: '#BD93F9',
    backgroundColor: 'rgba(189, 147, 249, 0.18)',
    shadowColor: '#BD93F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  chipText: { color: '#8B9BB4', fontSize: 14, fontWeight: '700' },
  chipTextSelected: { color: '#00F0FF' },
  chipTextPurple: { color: '#BD93F9' },
  saveBtn: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#BD93F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BD93F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#090D16', fontSize: 14, fontWeight: '900' },
  skipBtn: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#263859',
    backgroundColor: '#131B2E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  skipBtnText: { color: '#8B9BB4', fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
