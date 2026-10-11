import type { CoreCategory } from '../engine/tomorrowStrategy';
import type { FiveElement } from '../engine/types';

export type Locale = 'ko' | 'ja';

export interface CommonLocale {
  header: {
    todayOmen: string;
    solarDate: string;
    lunarDate: string;
  };
  dock: {
    share: string;
    soundOn: string;
    soundOff: string;
    settings: string;
  };
  settings: {
    title: string;
    birth: string;
    time: string;
    gender: string;
    male: string;
    female: string;
    lang: string;
    save: string;
  };
}

export interface Section01Locale {
  tab: string;
  title: string;
  subtitle: string;
  headerBadge: string;
  ohaengNames: Record<FiveElement, string>;
  keyTitle: Record<string, string>;
  modalBtn: string;
  chargeBtn: string;
  settle3Sec: string;
  settleDesc: string;
  settleDoneBadge: string;
  reSettleBtn: string;
  items: {
    objectTitle: string;
    businessTitle: string;
    partnerTitle: string;
  };
}

export interface Section02Locale {
  tab: string;
  title: string;
  subtitle: string;
  headerBadge: string;
  categories: Record<CoreCategory, { label: string; icon: string }>;
  innateTitle: string;
  maskTitle: string;
  innateBadge: string;
  maskBadge: string;
  mbtiInnate: Record<string, { summary: string; element: string }>;
  mbtiMask: Record<string, { summary: string; mask: string }>;
  tacticsTitle: string;
  tacticsSubtitle: string;
  nightAuditTitle: string;
}

export interface Section03Locale {
  pillars: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  elements: {
    stem: string;
    branch: string;
    tenGod: string;
    twelveFortune: string;
  };
  distribution: {
    title: string;
    wood: string;
    fire: string;
    earth: string;
    metal: string;
    water: string;
    dominant: string;
    deficient: string;
  };
}

export interface Section04TenGodItem {
  godHanja: string;
  inflowPower: number;
  inflowLabel: string;
  outflowRisk: number;
  outflowLabel: string;
  modeBadge: string;
  headline: string;
  baseInsight: string;
  actionDo: string;
  actionDont: string;
}

export interface Section04Locale {
  tab: string;
  title: string;
  subtitle: string;
  auraBadge: (god: string, ohaeng: string) => string;
  modeBadge: string;
  inflow: string;
  leak: string;
  insightTitle: string;
  doTitle: string;
  dontTitle: string;
  deepBtn: string;
  modal: {
    kicker: string;
    title: string;
    close: string;
  };
  tenGods: Record<string, Section04TenGodItem>;
}

export interface LocaleDictionary {
  appTitle: string;
  appSubtitle: string;
  appBrand: string;
  common: CommonLocale;
  section01: Section01Locale;
  section02: Section02Locale;
  section03: Section03Locale;
  section04: Section04Locale;
  sections: Record<string, { kicker: string; title: string; subtitle: string; headerBadge: string }>;
  categories: Record<string, string>;
  today: string;
  prevDay: string;
  nextDay: string;
  dateSelector: string;
  shareInsta: string;
  shareTwitter: string;
  postTwitter: string;
  close: string;
  capturing: string;
  twitterShareText: (celebName: string, rate: number) => string;
  rail: {
    share: string;
    soundOn: string;
    soundOff: string;
    settings: string;
  };
  langKr: string;
  langJp: string;
  langFullKr: string;
  langFullJp: string;
}
