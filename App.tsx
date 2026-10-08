import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { calculateSaju } from './src/engine/calculator';
import { analyzePartnerRadar } from './src/engine/partnerRadar';
import type { PartnerRadarResult } from './src/engine/partnerRadar';
import { buildPartnerPrescription } from './src/engine/partnerPrescription';
import type { PartnerPrescription } from './src/engine/partnerPrescription';
import { analyzeTodayMoney } from './src/engine/moneyEngine';
import { buildReelsContent } from './src/engine/reelsContent';
import { matchCelebrity } from './src/engine/celebrityEngine';
import { calculateMbtiSync, calculateSajuMbti, isValidMbti } from './src/engine/mbtiEngine';
import { calculateLifeDaeun } from './src/engine/timelineEngine';
import type { SajuResult } from './src/engine/types';
import {
  initDatabase,
  saveDailyLog,
  getDailyLog,
  saveUserProfile,
  getUserProfile,
  getLatestPartnerProfile,
  getUserOnboardingData,
  getPersonaPreference,
  savePersonaPreference,
  updateUserMbti,
  exportBackupJson,
  importBackupJson,
  DEFAULT_LIFE_SYNC_RATIO,
  DEFAULT_FOCUS_INTERESTS,
} from './src/database/db';
import type { CalendarType, PartnerProfile, UserOnboardingData, UserProfile } from './src/database/db';
import { BackupModal } from './src/components/BackupModal';
import { CelebrityShareModal } from './src/components/CelebrityShareModal';
import { DailyCardDeck } from './src/components/DailyCardDeck';
import type { DailyCardData } from './src/components/DailyCardDeck';
import { ElementCircuit } from './src/components/ElementCircuit';
import { LifeTimelineModal } from './src/components/LifeTimelineModal';
import { MbtiPickerModal } from './src/components/MbtiPickerModal';
import { TargetSettingModal } from './src/components/TargetSettingModal';
import { PartnerReportModal } from './src/components/PartnerReportModal';
import { PersonaPickerModal } from './src/components/PersonaPickerModal';
import {
  ProfileSettingModal,
  BIRTH_TIME_UNKNOWN,
  parseBirthDate,
  parseBirthTime,
} from './src/components/ProfileSettingModal';
import type { ProfileFormValues } from './src/components/ProfileSettingModal';
import { ReelsContainer } from './src/components/reels/ReelsContainer';
import { SettingsMenuModal } from './src/components/SettingsMenuModal';
import type { ReelsContext, ReelsLifePeek, ReelsMbtiPeek, ReelsPeoplePeek } from './src/types/reels';
import { AGENT_STORE, AGENT_TYPES } from './src/prompts/agents';
import type { AgentType } from './src/prompts/agents';
import { startAmbient, stopAmbient } from './src/utils/ambientSynth';

const DEFAULT_PROFILE_NAME = '호스트';
const DEFAULT_BIRTH_DATE = '1975-06-11';
const DEFAULT_BIRTH_TIME = '05:30';
const LEGACY_DEFAULT_BIRTH_TIME = '05:00';
const LOVE_CATEGORY = '치정/바람';
const ONBOARDING_FLAG_KEY = 'cybersaju.onboarding.v1';
const DEFAULT_PERSONA: AgentType = 'DOKSA';
/** 한 모달이 닫히는 애니메이션이 끝난 뒤 다음 모달을 열기 위한 대기 시간 */
const MODAL_TRANSITION_MS = 320;

const IS_WEB = Platform.OS === 'web';

// 모바일 브라우저는 주소창 때문에 100vh가 실제 보이는 영역보다 커서 하단 UI가 잘린다. dvh는 동적 뷰포트를 따른다.
const WEB_VIEWPORT_STYLE: ViewStyle | undefined = IS_WEB
  ? ({ height: '100dvh', minHeight: '100dvh', overflow: 'hidden' } as unknown as ViewStyle)
  : undefined;

/** react-native-web의 Alert.alert는 아무 동작도 하지 않으므로 브라우저 대화상자로 대체한다. */
function installWebAlert(): void {
  if (!IS_WEB || typeof window === 'undefined') return;

  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter((part) => typeof part === 'string' && part.length > 0).join('\n\n');
    const list = Array.isArray(buttons) ? buttons : [];

    if (list.length <= 1) {
      window.alert(text);
      list[0]?.onPress?.();
      return;
    }

    const cancelButton = list.find((button) => button.style === 'cancel') ?? list[list.length - 1];
    const confirmButton = list.find((button) => button !== cancelButton);
    const guide =
      confirmButton?.text && cancelButton?.text
        ? `\n\n▶ 확인: ${confirmButton.text} / 취소: ${cancelButton.text}`
        : '';
    if (window.confirm(`${text}${guide}`)) {
      confirmButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  };
}

installWebAlert();

/** 한글 단어 중간에서 줄이 끊기지 않도록 웹 전체에 keep-all을 적용한다. */
function installWebTextStyles(): void {
  if (!IS_WEB || typeof document === 'undefined') return;
  const STYLE_ID = 'cyber-saju-keep-all';
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = '#root, #root * { word-break: keep-all; overflow-wrap: break-word; }';
  document.head.appendChild(style);
}

installWebTextStyles();

const memoryFlags = new Map<string, string>();

function readFlag(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFlags.get(key) ?? null;
  }
}

function writeFlag(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memoryFlags.set(key, value);
  }
}

/** 영문 시스템 오류 문구는 숨기고, 한글 안내 문구만 사용자에게 보여 준다. */
function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return /[가-힣]/.test(message) ? message : '잠시 후 다시 시도해 주세요.';
}

function isSampleProfile(profile: UserProfile): boolean {
  return (
    profile.birthDate === DEFAULT_BIRTH_DATE &&
    (profile.birthTime === DEFAULT_BIRTH_TIME || profile.birthTime === LEGACY_DEFAULT_BIRTH_TIME) &&
    !profile.gender
  );
}

function computeSajuFromProfile(birthDate: string, birthTime: string, calendarType: CalendarType): SajuResult {
  const date = parseBirthDate(birthDate);
  if (!date) throw new Error('생년월일 형식이 올바르지 않습니다.');

  // 시간을 모르면 정오 기준으로 계산한다.
  const time = birthTime === BIRTH_TIME_UNKNOWN ? { hour: 12, minute: 0 } : parseBirthTime(birthTime);
  if (!time) throw new Error('태어난 시간 형식이 올바르지 않습니다.');

  return calculateSaju(date.year, date.month, date.day, time.hour, time.minute, calendarType !== 'lunar');
}

function parseStoredSaju(json: string | null | undefined): SajuResult | null {
  if (!json) return null;
  try {
    const saju = JSON.parse(json) as Partial<SajuResult> | null;
    if (
      saju &&
      typeof saju.dayMaster === 'string' &&
      saju.pillars?.day?.stem &&
      saju.pillars?.time?.stem &&
      saju.elementsRatio
    ) {
      return saju as SajuResult;
    }
    return null;
  } catch {
    return null;
  }
}

function isAgentType(value: unknown): value is AgentType {
  return typeof value === 'string' && (AGENT_TYPES as readonly string[]).includes(value);
}

function todayKey(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lifeOnboarding, setLifeOnboarding] = useState<UserOnboardingData>({
    syncRatio: DEFAULT_LIFE_SYNC_RATIO,
    interests: [...DEFAULT_FOCUS_INTERESTS],
    isSynced: false,
  });
  const [profileVisible, setProfileVisible] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [partnerVisible, setPartnerVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [dailyVisible, setDailyVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [personaVisible, setPersonaVisible] = useState(false);
  const [celebrityVisible, setCelebrityVisible] = useState(false);
  const [mbtiVisible, setMbtiVisible] = useState(false);
  const [persona, setPersona] = useState<AgentType>(DEFAULT_PERSONA);
  const [soundOn, setSoundOn] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saju = useMemo<SajuResult | null>(() => {
    if (!profile) return null;
    try {
      // 저장된 사주는 옛 엔진 결과일 수 있어, 항상 생년월일시로 다시 계산한다.
      return computeSajuFromProfile(profile.birthDate, profile.birthTime, profile.calendarType ?? 'solar');
    } catch {
      return parseStoredSaju(profile.sajuData);
    }
  }, [profile]);

  const reelsContent = useMemo(() => buildReelsContent(saju), [saju]);
  const money = useMemo(() => analyzeTodayMoney(saju), [saju]);
  const celebrityResult = useMemo(() => (saju ? matchCelebrity(saju) : null), [saju]);

  const innateMbti = useMemo(() => {
    if (!saju) return null;
    const { mbti } = calculateSajuMbti(saju);
    return isValidMbti(mbti) ? mbti : null;
  }, [saju]);

  const actualMbti = isValidMbti(profile?.actual_mbti) ? profile.actual_mbti : null;

  const mbtiInfo = useMemo<ReelsMbtiPeek | null>(() => {
    if (!innateMbti || !actualMbti) return null;
    const { syncRate, energyLeakage } = calculateMbtiSync(innateMbti, actualMbti);
    return { innate: innateMbti, actual: actualMbti, syncRate, leakage: energyLeakage };
  }, [innateMbti, actualMbti]);

  const { partnerRadar, partnerPrescription } = useMemo<{
    partnerRadar: PartnerRadarResult | null;
    partnerPrescription: PartnerPrescription | null;
  }>(() => {
    if (!partner) return { partnerRadar: null, partnerPrescription: null };
    try {
      const partnerSaju = computeSajuFromProfile(partner.birthDate, partner.birthTime, partner.calendarType);
      const radar = analyzePartnerRadar(partnerSaju);
      return {
        partnerRadar: radar,
        partnerPrescription: buildPartnerPrescription(partnerSaju, radar, partner.alias || partner.relation),
      };
    } catch {
      return { partnerRadar: null, partnerPrescription: null };
    }
  }, [partner]);

  const partnerInfo = useMemo<ReelsPeoplePeek | null>(() => {
    if (!partner) return null;
    return {
      label: `${partner.alias || partner.relation} · ${partner.birthDate}`,
      radarScore: partnerRadar?.score ?? null,
      radarLevel: partnerRadar?.level ?? null,
    };
  }, [partner, partnerRadar]);

  const lifeDaeun = useMemo(() => {
    if (!profile?.gender) return null;
    try {
      return calculateLifeDaeun(profile.birthDate, profile.birthTime, profile.gender, profile.calendarType ?? 'solar');
    } catch {
      return null;
    }
  }, [profile]);

  const daeun = useMemo<ReelsLifePeek | null>(() => {
    const current = lifeDaeun?.periods.find((period) => period.isCurrent);
    if (!current) return null;
    return {
      ageLabel: current.ageLabel,
      ganji: current.ganji.label,
      theme: current.theme,
      currentAgeLabel: `현재 ${lifeDaeun?.currentAgeLabel ?? ''}`.trim(),
    };
  }, [lifeDaeun]);

  const reelsContext = useMemo<ReelsContext>(
    () => ({
      omen: reelsContent,
      life: daeun,
      people: partnerInfo,
      money: money
        ? { headline: money.headline, power: money.power, defense: money.defense, status: money.status }
        : null,
      batteryLevel,
      mbti: mbtiInfo,
      elementsRatio: saju?.elementsRatio ?? null,
      personaLabel: `${AGENT_STORE[persona].emoji} ${AGENT_STORE[persona].name}`,
      soundOn,
    }),
    [reelsContent, daeun, partnerInfo, money, batteryLevel, mbtiInfo, saju, persona, soundOn]
  );

  const loadData = useCallback(async () => {
    setProfile(await getUserProfile());
    setLifeOnboarding(await getUserOnboardingData());
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function setup() {
      try {
        await initDatabase();

        let loaded = await getUserProfile();
        if (!loaded) {
          const sample = computeSajuFromProfile(DEFAULT_BIRTH_DATE, DEFAULT_BIRTH_TIME, 'solar');
          await saveUserProfile(DEFAULT_PROFILE_NAME, DEFAULT_BIRTH_DATE, DEFAULT_BIRTH_TIME, sample, {
            calendarType: 'solar',
          });
          loaded = await getUserProfile();
        }
        if (!loaded) throw new Error('프로필을 불러오지 못했습니다.');

        const savedPartner = await getLatestPartnerProfile().catch(() => null);
        const savedOnboarding = await getUserOnboardingData().catch(() => null);
        const savedLog = await getDailyLog(todayKey(new Date())).catch(() => null);
        const savedPersona = await getPersonaPreference().catch(() => null);

        // 이미 정보를 입력한 사용자는 안내 없이 바로 릴스로 들어간다.
        const needsOnboarding = readFlag(ONBOARDING_FLAG_KEY) !== 'done' && isSampleProfile(loaded);
        if (!needsOnboarding) writeFlag(ONBOARDING_FLAG_KEY, 'done');

        if (isMounted) {
          setProfile(loaded);
          setPartner(savedPartner);
          if (savedOnboarding) setLifeOnboarding(savedOnboarding);
          setBatteryLevel(savedLog?.energy_level ?? null);
          if (isAgentType(savedPersona)) setPersona(savedPersona);
          setOnboarding(needsOnboarding);
          setProfileVisible(needsOnboarding);
        }
      } catch (e) {
        console.error('데이터 준비 실패:', e);
      }
    }
    setup();
    return () => {
      isMounted = false;
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  useEffect(() => () => stopAmbient(), []);

  /** 백업 복원 직후 화면에 쓰이는 모든 저장 데이터를 다시 읽는다. */
  const reloadAll = useCallback(async () => {
    const [savedProfile, savedPartner, savedOnboarding, savedLog] = await Promise.all([
      getUserProfile().catch(() => null),
      getLatestPartnerProfile().catch(() => null),
      getUserOnboardingData().catch(() => null),
      getDailyLog(todayKey(new Date())).catch(() => null),
    ]);
    if (savedProfile) setProfile(savedProfile);
    setPartner(savedPartner);
    if (savedOnboarding) setLifeOnboarding(savedOnboarding);
    setBatteryLevel(savedLog?.energy_level ?? null);
  }, []);

  const afterModalClose = (action: () => void) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      action();
    }, MODAL_TRANSITION_MS);
  };

  const handleSaveProfile = async (values: ProfileFormValues) => {
    const computed = computeSajuFromProfile(values.birthDate, values.birthTime, values.calendarType);
    const { timelineSyncReset } = await saveUserProfile(
      profile?.name ?? DEFAULT_PROFILE_NAME,
      values.birthDate,
      values.birthTime,
      computed,
      { gender: values.gender, calendarType: values.calendarType, userLore: values.userLore }
    );
    await loadData();
    if (!onboarding && timelineSyncReset) {
      Alert.alert('운명 정보 저장 완료', '명식이 바뀌어 이전 대운 동기화가 해제되었어요. 대운을 다시 확인해 주세요.');
    }
  };

  const handleProfileSaved = (isNewProfile: boolean) => {
    setProfileVisible(false);
    setOnboarding(false);
    writeFlag(ONBOARDING_FLAG_KEY, 'done');
    // 처음 정보를 입력한 직후에는 내 대운 파도를 바로 보여 준다.
    if (isNewProfile) afterModalClose(() => setTimelineVisible(true));
  };

  const handleTimelineSynced = async () => {
    setLifeOnboarding(await getUserOnboardingData());
  };

  const handleTimelineRequestProfile = () => {
    setTimelineVisible(false);
    afterModalClose(() => setProfileVisible(true));
  };

  const handlePartnerSaved = async () => {
    setPartner(await getLatestPartnerProfile());
  };

  const handleOpenReport = () => {
    if (!partner) {
      setPartnerVisible(true);
      return;
    }
    setReportVisible(true);
  };

  const handleReportAddPartner = () => {
    setReportVisible(false);
    afterModalClose(() => setPartnerVisible(true));
  };

  const handlePurchase = () => {
    Alert.alert('결제 준비 중', '정밀 분석 리포트 결제는 곧 열려요. 조금만 기다려 주세요.');
  };

  const handleSaveDailyCard = async (data: DailyCardData) => {
    try {
      const now = new Date();
      // 정오 기준으로 계산해 자시(23시~) 일진 경계 이슈를 피한다.
      const dayPillar = calculateSaju(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, true).pillars.day;
      await saveDailyLog(
        todayKey(now),
        data.emotionElement,
        data.eventCategory,
        data.energyLevel,
        `${dayPillar.stem}${dayPillar.branch}`,
        data.shortMemo,
        undefined,
        data.tarotCard
      );
      setBatteryLevel(data.energyLevel);
      setDailyVisible(false);
    } catch (e) {
      Alert.alert('저장 오류', `카드 기록을 저장하지 못했습니다. ${describeError(e)}`);
      throw e;
    }
  };

  const handleEventCategorySelect = (category: string) => {
    if (category === LOVE_CATEGORY && !partner) {
      setDailyVisible(false);
      afterModalClose(() => setPartnerVisible(true));
    }
  };

  const openFromSettings = (open: () => void) => {
    setSettingsVisible(false);
    afterModalClose(open);
  };

  const handleToggleSound = (next: boolean) => {
    if (!next) {
      stopAmbient();
      setSoundOn(false);
    } else if (startAmbient()) {
      setSoundOn(true);
    } else {
      Alert.alert('소리를 켤 수 없어요', '이 브라우저에서는 배경 사운드를 지원하지 않아요.');
    }
  };

  const handleSelectPersona = async (next: AgentType) => {
    setPersona(next);
    setPersonaVisible(false);
    try {
      await savePersonaPreference(next);
    } catch (e) {
      Alert.alert('저장 오류', `도사 말투를 저장하지 못했습니다. ${describeError(e)}`);
    }
  };

  const handleOpenCelebrity = () => {
    if (!celebrityResult) {
      Alert.alert('매칭할 수 없어요', '사주 정보를 먼저 입력하면 나와 닮은 유명인을 찾아 드려요.');
      return;
    }
    setCelebrityVisible(true);
  };

  const handleOpenMbti = () => {
    if (!innateMbti) {
      Alert.alert('선천 MBTI를 읽지 못했어요', '사주 정보를 먼저 입력해 주세요.');
      return;
    }
    setMbtiVisible(true);
  };

  const handleSelectMbti = async (selected: string) => {
    if (!innateMbti || !isValidMbti(selected)) return;
    const { syncRate } = calculateMbtiSync(innateMbti, selected);
    try {
      await updateUserMbti(innateMbti, selected, syncRate);
      setProfile(await getUserProfile());
      setMbtiVisible(false);
    } catch (e) {
      Alert.alert('저장 오류', `MBTI를 저장하지 못했습니다. ${describeError(e)}`);
    }
  };

  const anyModalOpen =
    profileVisible ||
    timelineVisible ||
    partnerVisible ||
    reportVisible ||
    dailyVisible ||
    settingsVisible ||
    backupVisible ||
    personaVisible ||
    celebrityVisible ||
    mbtiVisible;

  return (
    <View style={[styles.root, WEB_VIEWPORT_STYLE]}>
      <ReelsContainer
        paused={anyModalOpen}
        context={reelsContext}
        onSettingsPress={() => setSettingsVisible(true)}
        onToggleSound={() => handleToggleSound(!soundOn)}
        onOpenTimeline={() => setTimelineVisible(true)}
        onOpenCelebrity={handleOpenCelebrity}
        onOpenMbti={handleOpenMbti}
        onOpenPartner={() => setPartnerVisible(true)}
        onOpenReport={handleOpenReport}
        onOpenDailyCard={() => setDailyVisible(true)}
        onOpenPersona={() => setPersonaVisible(true)}
      />

      <SettingsMenuModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        personaLabel={`${AGENT_STORE[persona].emoji} ${AGENT_STORE[persona].name}`}
        soundOn={soundOn}
        onOpenProfile={() =>
          openFromSettings(() => {
            setOnboarding(false);
            setProfileVisible(true);
          })
        }
        onOpenBackup={() => openFromSettings(() => setBackupVisible(true))}
        onOpenPersona={() => openFromSettings(() => setPersonaVisible(true))}
        onToggleSound={handleToggleSound}
      />

      <BackupModal
        visible={backupVisible}
        onClose={() => setBackupVisible(false)}
        onExport={exportBackupJson}
        onImport={importBackupJson}
        onRefresh={reloadAll}
      />

      <PersonaPickerModal
        visible={personaVisible}
        selected={persona}
        onClose={() => setPersonaVisible(false)}
        onSelect={handleSelectPersona}
      />

      <CelebrityShareModal
        visible={celebrityVisible}
        onClose={() => setCelebrityVisible(false)}
        celebrityResult={celebrityResult}
        userDayMaster={saju?.dayMaster ?? ''}
      />

      <MbtiPickerModal
        visible={mbtiVisible}
        selected={actualMbti}
        innateMbti={innateMbti}
        onClose={() => setMbtiVisible(false)}
        onSelect={handleSelectMbti}
      />

      <ProfileSettingModal
        visible={profileVisible}
        onClose={() => {
          setProfileVisible(false);
          setOnboarding(false);
        }}
        isOnboarding={onboarding}
        initialValues={
          profile && !onboarding
            ? {
                birthDate: profile.birthDate,
                birthTime: profile.birthTime,
                gender: profile.gender ?? undefined,
                calendarType: profile.calendarType ?? 'solar',
                userLore: profile.userLore ?? '',
              }
            : null
        }
        onSave={handleSaveProfile}
        onSaved={handleProfileSaved}
      />

      <LifeTimelineModal
        visible={timelineVisible}
        onClose={() => setTimelineVisible(false)}
        birthDate={profile?.birthDate ?? ''}
        birthTime={profile?.birthTime ?? ''}
        gender={profile?.gender ?? null}
        calendarType={profile?.calendarType ?? 'solar'}
        initialSyncRatio={lifeOnboarding.syncRatio}
        initialInterests={lifeOnboarding.interests}
        isSynced={lifeOnboarding.isSynced}
        onSynced={handleTimelineSynced}
        onRequestProfile={handleTimelineRequestProfile}
      />

      <TargetSettingModal
        visible={partnerVisible}
        onClose={() => setPartnerVisible(false)}
        initialValues={partner}
        onApply={handlePartnerSaved}
      />

      <PartnerReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        partner={partner}
        radar={partnerRadar}
        prescription={partnerPrescription}
        onPurchase={handlePurchase}
        onRequestPartner={handleReportAddPartner}
      />

      <Modal visible={dailyVisible} transparent animationType="slide" onRequestClose={() => setDailyVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetDismiss} onPress={() => setDailyVisible(false)} accessibilityLabel="닫기" />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>3초 오행 정산</Text>
              <Pressable onPress={() => setDailyVisible(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
              {saju && <ElementCircuit elementsRatio={saju.elementsRatio} />}
              <DailyCardDeck onSave={handleSaveDailyCard} onEventCategorySelect={handleEventCategorySelect} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05070D' },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheetDismiss: { flex: 1 },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '90%',
    backgroundColor: '#090D16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#1F2A40',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1F2A40',
    marginBottom: 10,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sheetTitle: { color: '#00FFCC', fontSize: 16, fontWeight: '900' },
  sheetClose: { color: '#8A99AD', fontSize: 20, fontWeight: '700', padding: 4 },
  sheetBody: { paddingTop: 12, paddingBottom: 8 },
});
