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
import { USER_LORE_MAX_LENGTH } from '../database/db';
import type { CalendarType, Gender } from '../database/db';

export const BIRTH_TIME_UNKNOWN = '모름';

export const UNIVERSAL_LORE_TEMPLATE = `[1. 나의 현재 상황 & 터전]
- 직업/하는 일: (예: 5년 차 직장인 / 자영업 매장 운영 / 이직 준비 중 / 프리랜서)
- 현재 환경: (예: 회사를 그만두고 내 일을 시작할지 고민 중 / 매출이 정체되어 돌파구가 필요한 시점)

[2. 가장 답답한 고민 & 풀리지 않는 문제]
- 돈/진로: (예: 올해 재물운이나 이직운이 언제 열리는지, 무리해서 확장이나 투자를 해도 되는지)
- 사람/관계: (예: 직장 내 사람 때문에 스트레스가 극심함 / 연인과의 미래나 결혼 문제로 갈등)

[3. 옥동자에게 바라는 점]
- 뻔한 덕담이나 두루뭉술한 위로는 사절!
- 내 타고난 사주 원국과 올해 대운의 흐름에 맞춰, 지금 당장 취해야 할 냉혹하고 구체적인 행동 요령을 짚어줄 것.`;

export interface ProfileFormValues {
  birthDate: string;
  /** `HH:mm` 또는 BIRTH_TIME_UNKNOWN */
  birthTime: string;
  gender: Gender;
  calendarType: CalendarType;
  userLore: string;
}

interface ProfileSettingModalProps {
  visible: boolean;
  onClose: () => void;
  /** 저장된 프로필 값. 없으면 빈 폼으로 시작한다. */
  initialValues?: Partial<ProfileFormValues> | null;
  /** 최초 실행 안내 문구를 표시한다. (기존 호환용, `isOnboarding`과 동일하게 동작) */
  onboarding?: boolean;
  /** 첫 실행 자동 온보딩(1/2단계) 모드. 헤더·저장 버튼 문구가 온보딩용으로 바뀐다. */
  isOnboarding?: boolean;
  /** 예외를 던지면 모달을 닫지 않고 오류를 안내한다. */
  onSave: (values: ProfileFormValues) => Promise<void>;
  /**
   * `onSave`가 성공한 직후에 호출된다. `isNewProfile`은 온보딩 모드이거나
   * 저장된 생년월일이 없던 상태에서의 최초 저장이면 true다.
   */
  onSaved?: (isNewProfile: boolean) => void;
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export function parseBirthDate(input: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { year, month, day };
}

export function parseBirthTime(input: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function isRealSolarDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
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

export function validateProfileForm(
  birthDate: string,
  birthTime: string,
  gender: Gender | null,
  calendarType: CalendarType
): string | null {
  const date = parseBirthDate(birthDate);
  if (!date) return `생년월일을 YYYY-MM-DD 형식으로 입력해 주세요. (${MIN_YEAR}~${MAX_YEAR}년)`;
  if (calendarType === 'solar' && !isRealSolarDate(date.year, date.month, date.day)) {
    return '존재하지 않는 양력 날짜입니다.';
  }
  if (calendarType === 'lunar' && date.day > 30) {
    return '음력 일자는 30일까지 입력할 수 있습니다.';
  }
  if (birthTime !== BIRTH_TIME_UNKNOWN && !parseBirthTime(birthTime)) {
    return '태어난 시간을 HH:mm 형식(예: 05:30)으로 입력하거나 "모름"을 선택해 주세요.';
  }
  if (!gender) return '성별을 선택해 주세요.';
  return null;
}

export const ProfileSettingModal: React.FC<ProfileSettingModalProps> = ({
  visible,
  onClose,
  initialValues,
  onboarding = false,
  isOnboarding = false,
  onSave,
  onSaved,
}) => {
  const onboardingMode = isOnboarding || onboarding;
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [userLore, setUserLore] = useState('');
  const [saving, setSaving] = useState(false);

  const initialRef = useRef(initialValues);
  initialRef.current = initialValues;

  // 모달이 열릴 때만 저장된 값으로 폼을 채워, 입력 중 부모 리렌더로 값이 초기화되지 않게 한다.
  useEffect(() => {
    if (!visible) return;
    const initial = initialRef.current;
    const savedTime = initial?.birthTime ?? '';
    setBirthDate(initial?.birthDate ?? '');
    setTimeUnknown(savedTime === BIRTH_TIME_UNKNOWN);
    setBirthTime(savedTime === BIRTH_TIME_UNKNOWN ? '' : savedTime);
    setGender(initial?.gender ?? null);
    setCalendarType(initial?.calendarType ?? 'solar');
    setUserLore((initial?.userLore ?? '').slice(0, USER_LORE_MAX_LENGTH));
    setSaving(false);
  }, [visible]);

  const handleLoadTemplate = () => {
    if (userLore.trim().length > 0 && userLore.trim() !== UNIVERSAL_LORE_TEMPLATE.trim()) {
      Alert.alert(
        '템플릿 불러오기',
        '작성 중인 내용이 옥동자 맞춤 표준 템플릿으로 대체됩니다. 불러오시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '불러오기',
            onPress: () => setUserLore(UNIVERSAL_LORE_TEMPLATE),
          },
        ]
      );
      return;
    }
    setUserLore(UNIVERSAL_LORE_TEMPLATE);
  };

  const handleSave = async () => {
    if (saving) return;
    const finalTime = timeUnknown ? BIRTH_TIME_UNKNOWN : birthTime.trim();
    const error = validateProfileForm(birthDate, finalTime, gender, calendarType);
    if (error || !gender) {
      Alert.alert('입력 확인', error ?? '성별을 선택해 주세요.');
      return;
    }

    const isNewProfile = onboardingMode || !initialRef.current?.birthDate;

    setSaving(true);
    try {
      await onSave({
        birthDate: birthDate.trim(),
        birthTime: finalTime,
        gender,
        calendarType,
        userLore: userLore.trim().slice(0, USER_LORE_MAX_LENGTH),
      });
      try {
        onSaved?.(isNewProfile);
      } catch (e) {
        console.warn('ProfileSettingModal onSaved 실패:', e);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 오류', `운명 정보 저장 실패: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBox}>
          <Text style={styles.title}>
            {onboardingMode ? '🔮 운명 데이터 동기화 (1/2)' : '[운명 정보 설정]'}
          </Text>
          <Text style={styles.subtitle}>
            {onboardingMode
              ? '처음 오셨군요. 정확한 점사를 위해 운명 정보를 입력해 주세요.'
              : '입력한 정보는 이 브라우저의 로컬 저장소에만 저장됩니다.'}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                <Text style={[styles.chipText, timeUnknown && styles.chipTextSelected]}>모름</Text>
              </Pressable>
            </View>
            {timeUnknown && (
              <Text style={styles.hint}>시간을 모르면 정오(12:00) 기준으로 계산하며, 시주는 참고용입니다.</Text>
            )}

            <View style={styles.toggleRow}>
              <View style={styles.toggleGroup}>
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
                      <Text style={[styles.chipText, gender === key && styles.chipTextSelected]}>
                        {text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.toggleGroup}>
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
                      <Text
                        style={[styles.chipText, calendarType === key && styles.chipTextSelected]}
                      >
                        {text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.loreHeaderRow}>
              <Text style={[styles.label, styles.loreLabel]}>🔮 나의 현재 현실 상황 & 은밀한 고민</Text>
              <Pressable
                onPress={handleLoadTemplate}
                accessibilityRole="button"
                accessibilityLabel="옥동자 맞춤 템플릿 불러오기"
                style={({ pressed }) => [styles.templateBtn, pressed && styles.pressed]}
              >
                <Text style={styles.templateBtnText}>📋 옥동자 맞춤 템플릿 불러오기</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, styles.loreInput]}
              value={userLore}
              onChangeText={setUserLore}
              placeholder="직업, 현재 처한 상황, 가장 답답한 돈/사람/진로 고민을 편하게 적어주세요. (상단 템플릿 버튼을 누르면 쉬운 가이드가 제공됩니다)"
              placeholderTextColor="#475569"
              multiline
              maxLength={USER_LORE_MAX_LENGTH}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {userLore.length}/{USER_LORE_MAX_LENGTH}
            </Text>
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.closeBtnText}>{onboardingMode ? '나중에' : '닫기'}</Text>
            </Pressable>
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
                <Text style={styles.saveBtnText}>
                  {onboardingMode ? '내 운명 분석 및 일생 대운 확인 ➔' : '⚡ 운명 정보 저장'}
                </Text>
              )}
            </Pressable>
          </View>
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
    backgroundColor: '#0B1220',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8B9BB4',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },
  label: {
    color: '#BD93F9',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
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
  hint: { color: '#55657E', fontSize: 10, marginTop: 6 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleGroup: { flex: 1 },
  segment: { flexDirection: 'row', gap: 6 },
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
  chipText: { color: '#8B9BB4', fontSize: 14, fontWeight: '700' },
  chipTextSelected: { color: '#00F0FF' },
  loreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  loreLabel: {
    marginTop: 0,
    marginBottom: 0,
  },
  templateBtn: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(189, 147, 249, 0.14)',
    borderWidth: 1,
    borderColor: '#BD93F9',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateBtnText: {
    color: '#D8B4FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  loreInput: {
    minHeight: 160,
    maxHeight: 280,
    paddingTop: 10,
    paddingBottom: 10,
    lineHeight: 20,
    fontSize: 13,
    borderColor: '#BD93F9',
  },
  counter: { color: '#55657E', fontSize: 10, textAlign: 'right', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
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
  saveBtn: {
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
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#090D16', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
