import { calculateLifeDaeun } from '../src/engine/timelineEngine';
import { calculateSaju } from '../src/engine/calculator';

const [date, time, gender] = ['1975-06-11', '05:00', 'male'] as const;
const saju = calculateSaju(1975, 6, 11, 5, 0, true);
console.log(
  `사주: ${(['year', 'month', 'day', 'time'] as const).map((k) => saju.pillars[k].stem + saju.pillars[k].branch).join(' / ')} | 일간 ${saju.dayMaster}`
);

const r = calculateLifeDaeun(date, time, gender, 'solar', '2026-10-07');
if (!r) throw new Error('계산 실패');
console.log(`${r.direction} · ${r.strength} · 현재 ${r.currentAgeLabel} · 첫 대운 만 ${r.firstDaeunAge}세\n`);
for (const p of r.periods) {
  console.log(
    `${p.index}대운 ${p.ganji.label} | ${p.startDate}~${p.endYear} | 만 ${p.startAge}~${p.endAge}세 | ${p.lifeStage} | ${p.stemGod}/${p.branchGod} | ${p.stage12}${p.isCurrent ? ' ◀ 현재' : ''}`
  );
  console.log(`    [headline] ${p.headline}`);
  console.log(`    [summary]  ${p.summary}`);
  console.log(p.detail.split('\n').map((line) => `    [detail]   ${line}`).join('\n'));
  console.log(`    [fact]     ${p.factCheck}`);
}
