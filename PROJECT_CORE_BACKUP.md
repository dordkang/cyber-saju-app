# PROJECT CORE BACKUP

> App.tsx white-canvas reset (design-first, port features later). Verified core logic snapshot.
> Mirror copies live in src/core_backup/.

## src/engine/types.ts

```ts
export type FiveElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type HeavenlyStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

export interface PillarData {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  elements: [FiveElement, FiveElement]; // [천간 오행, 지지 오행]
}

export interface SajuResult {
  dayMaster: HeavenlyStem; // 본원 (일간)
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    time: PillarData;
  };
  elementsRatio: Record<FiveElement, number>; // 오행 백분율 합계 100%
}
```

## src/engine/calculator.ts

```ts
import { Solar, Lunar } from 'lunar-javascript';
import { FiveElement, HeavenlyStem, EarthlyBranch, PillarData, SajuResult } from './types';

// 천간 오행 매핑
const STEM_ELEMENTS: Record<HeavenlyStem, FiveElement> = {
  '甲': 'Wood', '乙': 'Wood',
  '丙': 'Fire', '丁': 'Fire',
  '戊': 'Earth', '己': 'Earth',
  '庚': 'Metal', '辛': 'Metal',
  '壬': 'Water', '癸': 'Water'
};

// 지지 오행 매핑
const BRANCH_ELEMENTS: Record<EarthlyBranch, FiveElement> = {
  '寅': 'Wood', '卯': 'Wood',
  '巳': 'Fire', '午': 'Fire',
  '辰': 'Earth', '戌': 'Earth', '丑': 'Earth', '未': 'Earth',
  '申': 'Metal', '酉': 'Metal',
  '亥': 'Water', '子': 'Water'
};

function createPillar(stem: string, branch: string): PillarData {
  const hStem = stem as HeavenlyStem;
  const eBranch = branch as EarthlyBranch;
  return {
    stem: hStem,
    branch: eBranch,
    elements: [STEM_ELEMENTS[hStem], BRANCH_ELEMENTS[eBranch]]
  };
}

export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  isSolar: boolean = true
): SajuResult {
  const solarInstance = isSolar
    ? Solar.fromYmdHms(year, month, day, hour, minute, 0)
    : Lunar.fromYmdHms(year, month, day, hour, minute, 0).getSolar();

  const lunar = solarInstance.getLunar();
  const eightChar = lunar.getEightChar();

  // 1. 24절기 반영 사주 8자 산출
  const yearPillar = createPillar(eightChar.getYearGan(), eightChar.getYearZhi());
  const monthPillar = createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
  const dayPillar = createPillar(eightChar.getDayGan(), eightChar.getDayZhi());
  const timePillar = createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi());

  // 2. 8글자 오행 집계
  const allElements: FiveElement[] = [
    ...yearPillar.elements,
    ...monthPillar.elements,
    ...dayPillar.elements,
    ...timePillar.elements
  ];

  const counts: Record<FiveElement, number> = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0
  };

  allElements.forEach((el) => {
    counts[el] += 1;
  });

  // 3. 오행 백분율 산출 (글자당 12.5%, 총합 100%)
  const elementsRatio: Record<FiveElement, number> = {
    Wood: (counts.Wood / 8) * 100,
    Fire: (counts.Fire / 8) * 100,
    Earth: (counts.Earth / 8) * 100,
    Metal: (counts.Metal / 8) * 100,
    Water: (counts.Water / 8) * 100
  };

  return {
    dayMaster: dayPillar.stem,
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      time: timePillar
    },
    elementsRatio
  };
}
```

## src/database/db.ts

```ts
export type Gender = 'male' | 'female';
export type CalendarType = 'solar' | 'lunar';

export const USER_LORE_MAX_LENGTH = 200;

export interface UserProfile {
  id?: number;
  name: string;
  birthDate: string;
  birthTime: string;
  sajuData: string;
  saju_mbti?: string | null;
  actual_mbti?: string | null;
  mbti_sync?: number | null;
  gender?: Gender | null;
  calendarType?: CalendarType | null;
  userLore?: string | null;
}

export interface UserProfileOptions {
  gender?: Gender | null;
  calendarType?: CalendarType;
  userLore?: string;
}

export interface SaveUserProfileResult {
  /** 명식이 바뀌어 이전에 확정했던 대운 동기화가 해제되었는지 */
  timelineSyncReset: boolean;
}

/** `saveUserProfile`의 객체 호출 형태. `saju`(객체) 또는 `sajuData`(JSON 문자열) 중 하나를 전달한다. */
export interface SaveUserProfileInput extends UserProfileOptions {
  name: string;
  birthDate: string;
  birthTime: string;
  saju?: unknown;
  sajuData?: string;
}

export const PARTNER_RELATIONS = ['애인', '배우자', '썸', '전연인', '비즈니스'] as const;
export type PartnerRelation = (typeof PARTNER_RELATIONS)[number];

export interface PartnerProfile {
  id: number;
  /** 화면·프롬프트에 노출되는 상대 호칭 (기본값은 관계 칩 값) */
  alias: string;
  gender: Gender | null;
  birthDate: string;
  /** `HH:mm` 또는 '모름' */
  birthTime: string;
  calendarType: CalendarType;
  relation: string;
  createdAt: string;
}

/** 레거시 일기 타입. 웹 전환 후 저장소는 없고 호출 호환용으로만 유지한다. */
export interface DiaryEntry {
  id?: number;
  date: string;
  emotionScore: number;
  content: string;
  aiFeedback?: string;
}

export type EmotionElement = '목' | '화' | '토' | '금' | '수';
// `string & {}`는 리터럴 자동완성을 유지하면서 기존 기록(재물/직장/관계/건강/학습 등)도 허용한다.
export type EventCategory = '돈/대박' | '치정/바람' | '생존/직장' | '건강/액땜' | (string & {});
export type EnergyLevel = 25 | 50 | 75 | 100;

export interface DailyLog {
  date: string;
  emotion_element: EmotionElement;
  event_category: EventCategory;
  energy_level: EnergyLevel;
  short_memo: string | null;
  daily_ganji: string;
  ai_feedback: string | null;
  created_at: string;
  tarotCard?: string;
}

/** `saveDailyLog`의 객체 호출 형태 (`DailyLog`에서 created_at 제외, 선택 필드 완화). */
export interface DailyLogInput {
  date: string;
  emotion_element: EmotionElement;
  event_category: EventCategory;
  energy_level: EnergyLevel;
  daily_ganji: string;
  short_memo?: string | null;
  ai_feedback?: string | null;
  tarotCard?: string | null;
}

// timelineEngine의 InterestKey와 반드시 일치해야 한다.
export const FOCUS_INTEREST_KEYS = ['wealth', 'business', 'love', 'children', 'health'] as const;
export type FocusInterest = (typeof FOCUS_INTEREST_KEYS)[number];

export const DEFAULT_LIFE_SYNC_RATIO = 80;
export const DEFAULT_FOCUS_INTERESTS: readonly FocusInterest[] = ['wealth', 'business'];

export interface UserOnboardingData {
  syncRatio: number;
  interests: FocusInterest[];
  /** 사용자가 대운 동기화를 실제로 확정했는지. false이면 syncRatio/interests는 기본값일 뿐이다. */
  isSynced: boolean;
}

/** `updateUserOnboardingData`의 객체 호출 형태. 생략한 항목은 기존 값을 유지하고 `isSynced`는 기본 true. */
export interface OnboardingUpdates {
  syncRatio?: number;
  interests?: string[];
  isSynced?: boolean;
}

export const STORAGE_KEYS = {
  profile: 'cyber_saju_user_profile',
  onboarding: 'cyber_saju_onboarding',
  partners: 'cyber_saju_partner_profiles',
  dailyLogs: 'cyber_saju_daily_logs',
} as const;

const EMOTION_ELEMENTS: readonly EmotionElement[] = ['목', '화', '토', '금', '수'];
const EVENT_CATEGORY_MAX_LENGTH = 30;
const ENERGY_LEVELS: readonly EnergyLevel[] = [25, 50, 75, 100];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const PARTNER_TEXT_MAX_LENGTH = 20;
const PARTNER_TIME_UNKNOWN = '모름';
const BACKUP_VERSION = '2.0';

// ───────────────────────── 저장소 어댑터 ─────────────────────────

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage를 쓸 수 없는 환경(SSR, 사생활 보호 모드 등)에서는 메모리로 폴백해 앱이 죽지 않게 한다. */
const memoryStore = new Map<string, string>();

function getLocalStorage(): StorageLike | null {
  try {
    const ls = (globalThis as { localStorage?: StorageLike }).localStorage;
    return ls && typeof ls.getItem === 'function' ? ls : null;
  } catch {
    return null;
  }
}

function readRaw(key: string): string | null {
  const ls = getLocalStorage();
  if (ls) {
    try {
      return ls.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

function writeRaw(key: string, value: string): void {
  const ls = getLocalStorage();
  if (!ls) {
    memoryStore.set(key, value);
    return;
  }
  try {
    ls.setItem(key, value);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`브라우저 저장소에 쓰지 못했습니다 (${key}): ${reason}`);
  }
}

function removeRaw(key: string): void {
  memoryStore.delete(key);
  try {
    getLocalStorage()?.removeItem(key);
  } catch {
    // 삭제 실패는 치명적이지 않다.
  }
}

function readJson(key: string): unknown {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  writeRaw(key, JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ───────────────────────── 정규화 헬퍼 ─────────────────────────

/** 0/1, boolean, '1'/'true'만 확정으로 인정한다. 그 외(null, 형식 오류)는 모두 미확정. */
function normalizeSyncedFlag(value: unknown): boolean {
  return value === 1 || value === true || value === '1' || value === 'true';
}

function normalizeSyncRatio(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : null;
}

/** 배열 또는 JSON 문자열을 받아 허용된 관심사만 중복 없이 남긴다. 해석 불가 시 null. */
function normalizeFocusInterests(value: unknown): FocusInterest[] | null {
  let list: unknown = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(list)) return null;
  const result: FocusInterest[] = [];
  for (const item of list) {
    const key = FOCUS_INTEREST_KEYS.find((k) => k === item);
    if (key && !result.includes(key)) result.push(key);
  }
  return result;
}

function resolveFocusInterests(interests: FocusInterest[] | null): FocusInterest[] {
  return interests && interests.length > 0 ? interests : [...DEFAULT_FOCUS_INTERESTS];
}

function normalizeGender(value: unknown): Gender | null {
  return value === 'male' || value === 'female' ? value : null;
}

function normalizeCalendarType(value: unknown): CalendarType | null {
  return value === 'solar' || value === 'lunar' ? value : null;
}

function normalizeUserLore(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, USER_LORE_MAX_LENGTH) : '';
}

function trimToLength(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function defaultOnboarding(): UserOnboardingData {
  return {
    syncRatio: DEFAULT_LIFE_SYNC_RATIO,
    interests: [...DEFAULT_FOCUS_INTERESTS],
    isSynced: false,
  };
}

// ───────────────────────── 저장 레코드 파서 ─────────────────────────

function parseStoredProfile(raw: unknown): UserProfile | null {
  if (!isRecord(raw)) return null;
  const { name, birthDate, birthTime, sajuData } = raw;
  if (
    typeof name !== 'string' ||
    typeof birthDate !== 'string' ||
    typeof birthTime !== 'string' ||
    typeof sajuData !== 'string'
  ) {
    return null;
  }
  const mbtiSync = normalizeSyncRatio(raw.mbti_sync);
  return {
    id: 1,
    name,
    birthDate,
    birthTime,
    sajuData,
    saju_mbti: typeof raw.saju_mbti === 'string' ? raw.saju_mbti : null,
    actual_mbti: typeof raw.actual_mbti === 'string' ? raw.actual_mbti : null,
    mbti_sync: mbtiSync ?? 100,
    gender: normalizeGender(raw.gender),
    calendarType: normalizeCalendarType(raw.calendarType) ?? 'solar',
    userLore: normalizeUserLore(raw.userLore),
  };
}

function parseStoredOnboarding(raw: unknown): UserOnboardingData {
  const fallback = defaultOnboarding();
  if (!isRecord(raw)) return fallback;
  return {
    syncRatio: normalizeSyncRatio(raw.syncRatio) ?? fallback.syncRatio,
    interests: resolveFocusInterests(normalizeFocusInterests(raw.interests)),
    isSynced: normalizeSyncedFlag(raw.isSynced),
  };
}

function parseStoredDailyLog(raw: unknown): DailyLog | null {
  if (!isRecord(raw)) return null;
  const date = raw.date;
  const element = raw.emotion_element;
  const category = raw.event_category;
  const energy = raw.energy_level;
  const ganji = raw.daily_ganji;
  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) return null;
  if (typeof element !== 'string' || !EMOTION_ELEMENTS.includes(element as EmotionElement)) return null;
  if (typeof category !== 'string' || !category.trim() || category.length > EVENT_CATEGORY_MAX_LENGTH) {
    return null;
  }
  if (typeof energy !== 'number' || !ENERGY_LEVELS.includes(energy as EnergyLevel)) return null;
  if (typeof ganji !== 'string' || !ganji) return null;

  const tarot = typeof raw.tarotCard === 'string' && raw.tarotCard.trim() ? raw.tarotCard.trim() : undefined;
  const log: DailyLog = {
    date,
    emotion_element: element as EmotionElement,
    event_category: category,
    energy_level: energy as EnergyLevel,
    short_memo: typeof raw.short_memo === 'string' ? raw.short_memo : null,
    daily_ganji: ganji,
    ai_feedback: typeof raw.ai_feedback === 'string' ? raw.ai_feedback : null,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : '',
  };
  if (tarot) log.tarotCard = tarot;
  return log;
}

function parseStoredPartner(raw: unknown): PartnerProfile | null {
  if (!isRecord(raw)) return null;
  const birthDate = raw.birthDate;
  if (typeof birthDate !== 'string' || !DATE_PATTERN.test(birthDate)) return null;
  const id = raw.id;
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) return null;

  const relation = trimToLength(raw.relation, PARTNER_TEXT_MAX_LENGTH);
  return {
    id,
    alias: trimToLength(raw.alias, PARTNER_TEXT_MAX_LENGTH) || relation || '상대방',
    gender: normalizeGender(raw.gender),
    birthDate,
    birthTime: trimToLength(raw.birthTime, 5) || PARTNER_TIME_UNKNOWN,
    calendarType: normalizeCalendarType(raw.calendarType) ?? 'solar',
    relation,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
  };
}

function readDailyLogMap(): Record<string, DailyLog> {
  const raw = readJson(STORAGE_KEYS.dailyLogs);
  const logs: Record<string, DailyLog> = {};
  const entries = Array.isArray(raw) ? raw : isRecord(raw) ? Object.values(raw) : [];
  for (const entry of entries) {
    const log = parseStoredDailyLog(entry);
    if (log) logs[log.date] = log;
  }
  return logs;
}

function readPartners(): PartnerProfile[] {
  const raw = readJson(STORAGE_KEYS.partners);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseStoredPartner)
    .filter((p): p is PartnerProfile => p !== null)
    .sort((a, b) => a.id - b.id);
}

function readProfile(): UserProfile | null {
  return parseStoredProfile(readJson(STORAGE_KEYS.profile));
}

function readOnboarding(): UserOnboardingData {
  return parseStoredOnboarding(readJson(STORAGE_KEYS.onboarding));
}

// ───────────────────────── 초기화 ─────────────────────────

export async function initDatabase(): Promise<void> {
  // 웹 localStorage는 스키마가 없으므로 접근 가능 여부만 확인한다. 불가하면 메모리 폴백으로 동작한다.
  const ls = getLocalStorage();
  if (!ls) return;
  try {
    const probeKey = '__cyber_saju_probe__';
    ls.setItem(probeKey, '1');
    ls.removeItem(probeKey);
  } catch (e) {
    console.warn('localStorage를 사용할 수 없어 메모리 저장소로 폴백합니다:', e);
  }
}

// ───────────────────────── 사용자 프로필 ─────────────────────────

export async function saveUserProfile(input: SaveUserProfileInput): Promise<SaveUserProfileResult>;
export async function saveUserProfile(
  name: string,
  birthDate: string,
  birthTime: string,
  saju: unknown,
  options?: UserProfileOptions
): Promise<SaveUserProfileResult>;
export async function saveUserProfile(
  first: string | SaveUserProfileInput,
  birthDateArg?: string,
  birthTimeArg?: string,
  sajuArg?: unknown,
  optionsArg?: UserProfileOptions
): Promise<SaveUserProfileResult> {
  let name: string;
  let birthDate: string;
  let birthTime: string;
  let sajuJson: string;
  let options: UserProfileOptions | undefined;

  if (typeof first === 'object' && first !== null) {
    name = first.name;
    birthDate = first.birthDate;
    birthTime = first.birthTime;
    sajuJson = typeof first.sajuData === 'string' ? first.sajuData : JSON.stringify(first.saju ?? null);
    options = first;
  } else {
    name = first as string;
    birthDate = birthDateArg ?? '';
    birthTime = birthTimeArg ?? '';
    sajuJson = JSON.stringify(sajuArg ?? null);
    options = optionsArg;
  }

  if (typeof name !== 'string' || typeof birthDate !== 'string' || typeof birthTime !== 'string') {
    throw new Error('saveUserProfile: name, birthDate, birthTime must be strings');
  }

  const existing = readProfile();
  let timelineSyncReset = false;

  if (existing) {
    // options에 명시된 항목만 갱신하고, 생략된 항목은 기존 값을 보존한다.
    const prevGender = normalizeGender(existing.gender);
    const prevCalendar = normalizeCalendarType(existing.calendarType) ?? 'solar';
    let nextGender = prevGender;
    let nextCalendar = prevCalendar;
    let nextLore = normalizeUserLore(existing.userLore);
    if (options && options.gender !== undefined) nextGender = normalizeGender(options.gender);
    if (options && options.calendarType !== undefined) {
      nextCalendar = normalizeCalendarType(options.calendarType) ?? 'solar';
    }
    if (options && options.userLore !== undefined) nextLore = normalizeUserLore(options.userLore);

    // 대운은 생년월일·시간·성별(·양/음력)로 결정되므로 명식이 바뀌면 이전 일치율 검증은 무효다.
    // 이름이나 userLore만 바뀐 저장은 확정 상태를 유지한다.
    const chartChanged =
      existing.birthDate.trim() !== birthDate.trim() ||
      existing.birthTime.trim() !== birthTime.trim() ||
      prevGender !== nextGender ||
      prevCalendar !== nextCalendar;

    const next: UserProfile = {
      ...existing,
      name,
      birthDate,
      birthTime,
      sajuData: sajuJson,
      gender: nextGender,
      calendarType: nextCalendar,
      userLore: nextLore,
    };
    writeJson(STORAGE_KEYS.profile, next);

    if (chartChanged) {
      const onboarding = readOnboarding();
      timelineSyncReset = onboarding.isSynced;
      if (onboarding.isSynced) {
        writeJson(STORAGE_KEYS.onboarding, { ...onboarding, isSynced: false });
      }
    }
  } else {
    const created: UserProfile = {
      id: 1,
      name,
      birthDate,
      birthTime,
      sajuData: sajuJson,
      saju_mbti: null,
      actual_mbti: null,
      mbti_sync: 100,
      gender: normalizeGender(options?.gender),
      calendarType: normalizeCalendarType(options?.calendarType) ?? 'solar',
      userLore: normalizeUserLore(options?.userLore),
    };
    writeJson(STORAGE_KEYS.profile, created);
    writeJson(STORAGE_KEYS.onboarding, defaultOnboarding());
  }
  return { timelineSyncReset };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return readProfile();
}

export async function updateUserMbti(
  sajuMbti: string,
  actualMbti: string,
  mbtiSync: number
): Promise<boolean> {
  if (!Number.isFinite(mbtiSync)) {
    throw new Error('updateUserMbti: mbtiSync must be a finite number');
  }
  const clampedSync = Math.min(100, Math.max(0, Math.round(mbtiSync)));

  const profile = readProfile();
  if (!profile) return false;
  writeJson(STORAGE_KEYS.profile, {
    ...profile,
    saju_mbti: sajuMbti,
    actual_mbti: actualMbti,
    mbti_sync: clampedSync,
  });
  return true;
}

// ───────────────────────── 온보딩(대운 싱크로) ─────────────────────────

export async function updateUserOnboardingData(updates: OnboardingUpdates): Promise<void>;
export async function updateUserOnboardingData(syncRatio: number, interests: string[]): Promise<void>;
export async function updateUserOnboardingData(
  first: number | OnboardingUpdates,
  interestsArg?: string[]
): Promise<void> {
  const current = readOnboarding();
  let ratioInput: unknown;
  let interestsInput: unknown;
  let isSynced = true;

  if (typeof first === 'object' && first !== null) {
    ratioInput = first.syncRatio !== undefined ? first.syncRatio : current.syncRatio;
    interestsInput = first.interests !== undefined ? first.interests : current.interests;
    if (first.isSynced !== undefined) isSynced = first.isSynced === true;
  } else {
    ratioInput = first;
    interestsInput = interestsArg;
  }

  const ratio = normalizeSyncRatio(ratioInput);
  if (ratio === null) {
    throw new Error('updateUserOnboardingData: syncRatio must be a finite number');
  }
  const normalized = normalizeFocusInterests(interestsInput);
  if (!normalized || normalized.length === 0) {
    throw new Error(
      `updateUserOnboardingData: interests must include at least one of ${FOCUS_INTEREST_KEYS.join(', ')}`
    );
  }
  if (!readProfile()) {
    throw new Error('updateUserOnboardingData: user_profile row not found');
  }

  const next: UserOnboardingData = { syncRatio: ratio, interests: normalized, isSynced };
  writeJson(STORAGE_KEYS.onboarding, next);
}

export async function getUserOnboardingData(): Promise<UserOnboardingData> {
  try {
    if (!readProfile()) return defaultOnboarding();
    return readOnboarding();
  } catch {
    return defaultOnboarding();
  }
}

// ───────────────────────── 일일 로그 (3초 오행 카드) ─────────────────────────

export async function saveDailyLog(log: DailyLogInput): Promise<void>;
export async function saveDailyLog(
  date: string,
  emotionElement: EmotionElement,
  eventCategory: EventCategory,
  energyLevel: EnergyLevel,
  dailyGanji: string,
  shortMemo?: string,
  aiFeedback?: string,
  tarotCard?: string
): Promise<void>;
export async function saveDailyLog(
  first: string | DailyLogInput,
  emotionElementArg?: EmotionElement,
  eventCategoryArg?: EventCategory,
  energyLevelArg?: EnergyLevel,
  dailyGanjiArg?: string,
  shortMemoArg?: string,
  aiFeedbackArg?: string,
  tarotCardArg?: string
): Promise<void> {
  const input: Partial<DailyLogInput> =
    typeof first === 'object' && first !== null
      ? first
      : {
          date: first as string,
          emotion_element: emotionElementArg,
          event_category: eventCategoryArg,
          energy_level: energyLevelArg,
          daily_ganji: dailyGanjiArg,
          short_memo: shortMemoArg,
          ai_feedback: aiFeedbackArg,
          tarotCard: tarotCardArg,
        };

  const { date, emotion_element: emotionElement, event_category: eventCategory } = input;
  const { energy_level: energyLevel, daily_ganji: dailyGanji } = input;

  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
    throw new Error(`saveDailyLog: date must be YYYY-MM-DD (received "${String(date)}")`);
  }
  if (!emotionElement || !EMOTION_ELEMENTS.includes(emotionElement)) {
    throw new Error(`saveDailyLog: invalid emotionElement "${String(emotionElement)}"`);
  }
  if (
    typeof eventCategory !== 'string' ||
    !eventCategory.trim() ||
    eventCategory.length > EVENT_CATEGORY_MAX_LENGTH
  ) {
    throw new Error(`saveDailyLog: invalid eventCategory "${String(eventCategory)}"`);
  }
  if (energyLevel === undefined || !ENERGY_LEVELS.includes(energyLevel)) {
    throw new Error(`saveDailyLog: energyLevel must be one of ${ENERGY_LEVELS.join(', ')}`);
  }
  if (!dailyGanji) {
    throw new Error('saveDailyLog: dailyGanji is required');
  }

  const logs = readDailyLogMap();
  const previous = logs[date];
  const incomingTarot =
    typeof input.tarotCard === 'string' && input.tarotCard.trim() ? input.tarotCard.trim() : undefined;
  const incomingFeedback = typeof input.ai_feedback === 'string' ? input.ai_feedback : null;

  // ai_feedback·tarotCard는 미전달(null) 시 기존 값을 보존하고, created_at은 최초 생성 시각을 유지한다.
  const next: DailyLog = {
    date,
    emotion_element: emotionElement,
    event_category: eventCategory,
    energy_level: energyLevel,
    short_memo: typeof input.short_memo === 'string' ? input.short_memo : null,
    daily_ganji: dailyGanji,
    ai_feedback: incomingFeedback ?? previous?.ai_feedback ?? null,
    created_at: previous?.created_at || new Date().toISOString(),
  };
  const tarot = incomingTarot ?? previous?.tarotCard;
  if (tarot) next.tarotCard = tarot;

  logs[date] = next;
  writeJson(STORAGE_KEYS.dailyLogs, logs);
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  return readDailyLogMap()[date] ?? null;
}

/** 전체 일일 로그를 최신 날짜순으로 반환한다. */
export async function getDailyLogs(): Promise<DailyLog[]> {
  return Object.values(readDailyLogMap()).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

// ───────────────────────── 궁합 상대 프로필 ─────────────────────────

/** 전체 상대방 목록을 최신 등록순으로 반환한다. */
export async function getPartnerProfiles(): Promise<PartnerProfile[]> {
  return readPartners().reverse();
}

export async function getLatestPartnerProfile(): Promise<PartnerProfile | null> {
  const partners = readPartners();
  return partners.length > 0 ? (partners[partners.length - 1] ?? null) : null;
}

export async function savePartnerProfile(
  data: Omit<PartnerProfile, 'id' | 'createdAt'>
): Promise<void> {
  const alias = trimToLength(data?.alias, PARTNER_TEXT_MAX_LENGTH);
  const relation = trimToLength(data?.relation, PARTNER_TEXT_MAX_LENGTH);
  const birthDate = trimToLength(data?.birthDate, 10);
  const birthTime = trimToLength(data?.birthTime, 5);

  if (!alias) {
    throw new Error('savePartnerProfile: alias is required');
  }
  if (!DATE_PATTERN.test(birthDate)) {
    throw new Error(`savePartnerProfile: birthDate must be YYYY-MM-DD (received "${birthDate}")`);
  }
  if (birthTime !== PARTNER_TIME_UNKNOWN && !TIME_PATTERN.test(birthTime)) {
    throw new Error(`savePartnerProfile: birthTime must be HH:mm or "${PARTNER_TIME_UNKNOWN}"`);
  }

  const partners = readPartners();
  const nextId = partners.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  partners.push({
    id: nextId,
    alias,
    gender: normalizeGender(data.gender),
    birthDate,
    birthTime,
    calendarType: normalizeCalendarType(data.calendarType) ?? 'solar',
    relation,
    createdAt: new Date().toISOString(),
  });
  writeJson(STORAGE_KEYS.partners, partners);
}

export async function deletePartnerProfile(id: number): Promise<void> {
  const partners = readPartners();
  const remaining = partners.filter((p) => p.id !== id);
  if (remaining.length === partners.length) return;
  writeJson(STORAGE_KEYS.partners, remaining);
}

// ───────────────────────── 레거시 일기 호환용 더미 ─────────────────────────

export async function saveDiaryEntry(_entry: DiaryEntry): Promise<void> {}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  return [];
}

export async function deleteDiaryEntry(_id: number): Promise<void> {}

// ───────────────────────── 백업(JSON export / import) ─────────────────────────

export async function exportBackupJson(): Promise<string> {
  const profile = readProfile();
  const onboarding = readOnboarding();
  // 프로필은 구버전 백업과 같은 snake_case 키 형태를 유지해 두 버전이 같은 파서로 복원된다.
  const profileRecord = profile
    ? {
        name: profile.name,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        sajuData: profile.sajuData,
        saju_mbti: profile.saju_mbti ?? null,
        actual_mbti: profile.actual_mbti ?? null,
        mbti_sync: profile.mbti_sync ?? 100,
        gender: profile.gender ?? null,
        calendar_type: profile.calendarType ?? 'solar',
        user_lore: profile.userLore ?? '',
        life_sync_ratio: onboarding.syncRatio,
        focus_interests: onboarding.interests,
        is_timeline_synced: onboarding.isSynced ? 1 : 0,
      }
    : null;

  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profile: profileRecord,
      diaries: [],
      dailyLogs: await getDailyLogs(),
      partners: readPartners(),
    },
    null,
    2
  );
}

export async function exportDataAsJson(): Promise<string> {
  return exportBackupJson();
}

interface ParsedBackupProfile {
  profile: UserProfile;
  onboarding: UserOnboardingData;
}

function parseBackupProfile(raw: unknown): ParsedBackupProfile | null {
  if (!isRecord(raw)) return null;
  const sajuData =
    typeof raw.sajuData === 'string' ? raw.sajuData : raw.sajuData != null ? JSON.stringify(raw.sajuData) : null;
  if (
    typeof raw.name !== 'string' ||
    typeof raw.birthDate !== 'string' ||
    typeof raw.birthTime !== 'string' ||
    sajuData === null
  ) {
    return null;
  }
  const profile = parseStoredProfile({
    name: raw.name,
    birthDate: raw.birthDate,
    birthTime: raw.birthTime,
    sajuData,
    saju_mbti: raw.saju_mbti,
    actual_mbti: raw.actual_mbti,
    mbti_sync: raw.mbti_sync,
    gender: raw.gender,
    calendarType: raw.calendar_type ?? raw.calendarType,
    userLore: raw.user_lore ?? raw.userLore,
  });
  if (!profile) return null;
  return {
    profile,
    onboarding: {
      syncRatio: normalizeSyncRatio(raw.life_sync_ratio) ?? DEFAULT_LIFE_SYNC_RATIO,
      interests: resolveFocusInterests(normalizeFocusInterests(raw.focus_interests)),
      isSynced: normalizeSyncedFlag(raw.is_timeline_synced),
    },
  };
}

export async function importBackupJson(jsonString: string): Promise<boolean> {
  const touchedKeys = [
    STORAGE_KEYS.profile,
    STORAGE_KEYS.onboarding,
    STORAGE_KEYS.dailyLogs,
    STORAGE_KEYS.partners,
  ];
  const snapshot = touchedKeys.map((key) => [key, readRaw(key)] as const);

  try {
    const data: unknown = JSON.parse(jsonString);
    if (!isRecord(data)) return false;

    const hasProfile = data.profile != null;
    const hasLogs = Array.isArray(data.dailyLogs);
    const hasPartners = Array.isArray(data.partners);
    if (!hasProfile && !hasLogs && !hasPartners) return false;

    // 쓰기 전에 모두 검증해 형식 오류 시 기존 데이터가 건드려지지 않게 한다.
    const parsedProfile = hasProfile ? parseBackupProfile(data.profile) : null;
    if (hasProfile && !parsedProfile) return false;

    const logs: Record<string, DailyLog> = {};
    if (hasLogs) {
      for (const entry of data.dailyLogs as unknown[]) {
        const log = parseStoredDailyLog(entry);
        if (log) logs[log.date] = log;
      }
    }

    const partners: PartnerProfile[] = [];
    if (hasPartners) {
      const usedIds = new Set<number>();
      let fallbackId = 0;
      for (const entry of data.partners as unknown[]) {
        const parsed = parseStoredPartner(entry);
        if (!parsed) continue;
        let id = parsed.id;
        if (usedIds.has(id)) {
          fallbackId = Math.max(fallbackId, ...usedIds) + 1;
          id = fallbackId;
        }
        usedIds.add(id);
        partners.push({ ...parsed, id });
      }
    }

    if (parsedProfile) {
      writeJson(STORAGE_KEYS.profile, parsedProfile.profile);
      writeJson(STORAGE_KEYS.onboarding, parsedProfile.onboarding);
    }
    if (hasLogs) writeJson(STORAGE_KEYS.dailyLogs, logs);
    if (hasPartners) writeJson(STORAGE_KEYS.partners, partners);
    return true;
  } catch (e) {
    console.error('백업 복원 실패:', e);
    for (const [key, value] of snapshot) {
      try {
        if (value === null) removeRaw(key);
        else writeRaw(key, value);
      } catch {
        // 롤백 실패는 원 에러를 가리지 않도록 무시한다.
      }
    }
    return false;
  }
}

export async function importDataFromJson(jsonString: string): Promise<boolean> {
  return importBackupJson(jsonString);
}

```
