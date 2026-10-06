import { calculateLifeDaeun } from '../src/engine/timelineEngine';

const CASES: Array<[string, string, 'male' | 'female']> = [
  ['1975-06-11', '05:30', 'male'],
  ['1980-03-20', '10:00', 'male'],
  ['1985-09-01', '12:00', 'female'],
  ['1990-05-02', '14:30', 'male'],
  ['1992-11-23', '09:00', 'female'],
];

for (const [date, time, gender] of CASES) {
  const r = calculateLifeDaeun(date, time, gender, 'solar', '2026-10-07');
  if (!r) {
    console.log(`${date} ${time} ${gender}: 계산 실패`);
    continue;
  }
  const first = r.periods[0];
  const cur = r.periods.find((p) => p.isCurrent);
  console.log(
    `${date} ${time} ${gender === 'male' ? '남' : '여'} ${r.direction} | 첫 대운 만 ${r.firstDaeunAge}세(${first?.startDate}) ${first?.ganji.label} | ` +
      `현재 만 ${r.currentAge}세 → ${cur ? `${cur.ageLabel} ${cur.ganji.label}` : '첫 대운 이전'}`
  );
  console.log('   ' + r.periods.slice(0, 8).map((p) => `${p.startAge}:${p.ganji.label}`).join('  '));
}
