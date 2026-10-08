import { Solar } from 'lunar-javascript';
import {
  calculateLifeDaeun,
  calculateYearFortune,
  getBranchTenGod,
  getStructuralContext,
  getTenGod,
  getTwelveStage,
} from '../src/engine/timelineEngine';
import { calculateSaju } from '../src/engine/calculator';

const birth = '1975-06-11';
const opts = { birthTime: '05:00', gender: 'male' as const, calendarType: 'solar' as const, referenceDate: '2026-10-07' };

const saju = calculateSaju(1975, 6, 11, 5, 0, true);
const dm = saju.dayMaster;
const e = Solar.fromYmdHms(1975, 6, 11, 5, 0, 0).getLunar().getEightChar();
console.log('--- 원국 십성/12운성/지장간 ---');
const rows: Array<['year' | 'month' | 'day' | 'time', string[]]> = [
  ['year', e.getYearHideGan()],
  ['month', e.getMonthHideGan()],
  ['day', e.getDayHideGan()],
  ['time', e.getTimeHideGan()],
];
for (const [k, hide] of rows) {
  const p = saju.pillars[k];
  console.log(
    `${k} ${p.stem}${p.branch} | 천간 ${k === 'day' ? '일간' : getTenGod(dm, p.stem)} | 지지 ${getBranchTenGod(dm, p.branch)} | 12운성 ${getTwelveStage(dm, p.branch)} | 지장간 ${hide.join('')}`
  );
}
console.log('납음/공망:', e.getDayXunKong?.(), e.getYearNaYin?.(), e.getDayNaYin?.());

console.log('\n--- 구조 ---');
console.log(getStructuralContext(birth, '2026-10-07', opts)?.summary);

console.log('\n--- 연운 (2026~2056) ---');
for (let y = 2026; y <= 2056; y += 1) {
  const r = calculateYearFortune(birth, y, ['wealth', 'business', 'love', 'children', 'health'], 70, opts);
  if (!r) continue;
  console.log(
    `${y} ${r.ganji.label} 만${r.ageStart}~${r.ageEnd} | ${r.score}점 ${r.grade} | ${r.keyword} | 대운 ${r.daeunGanji?.label} | 재${r.interestScores.wealth} 사${r.interestScores.business} 애${r.interestScores.love} 자${r.interestScores.children} 건${r.interestScores.health} | ${r.interactions.map((n) => n.detail.replace(/\(.*?\)/g, '').split(' — ')[0]).join(', ')}`
  );
}

console.log('\n--- 지난 대운 스토리 ---');
const d = calculateLifeDaeun(birth, '05:00', 'male', 'solar', '2026-10-07');
d?.periods.forEach((p) => console.log(p.ganji.label, '|', p.headline, '|', p.factCheck));
