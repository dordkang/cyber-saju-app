import { calculateSaju } from '../src/engine/calculator';
import { buildNatalSummary } from '../src/engine/natalSummary';

interface Case {
  name: string;
  input: [number, number, number, number, number];
  expected: { pillars: [string, string, string, string]; dayMaster: string; ratio: Record<string, number> };
}

const CASES: Case[] = [
  {
    name: '1975-06-11 05:30 (망종 이후, 묘시)',
    input: [1975, 6, 11, 5, 30],
    expected: {
      pillars: ['乙卯', '壬午', '戊子', '乙卯'],
      dayMaster: '戊',
      ratio: { Wood: 50, Fire: 12.5, Earth: 12.5, Metal: 0, Water: 25 },
    },
  },
];

let failed = 0;
for (const c of CASES) {
  const saju = calculateSaju(...c.input, true);
  const natal = buildNatalSummary(saju);
  const actual = natal.pillars.map((p) => `${p.stem}${p.branch}`);
  const ratio = Object.fromEntries(natal.ratio.map((r) => [r.element, r.percent]));

  const checks: Array<[string, boolean, unknown, unknown]> = [
    ['4주', actual.join('/') === c.expected.pillars.join('/'), actual.join('/'), c.expected.pillars.join('/')],
    ['일간', natal.dayMaster === c.expected.dayMaster && saju.dayMaster === c.expected.dayMaster, natal.dayMaster, c.expected.dayMaster],
    ['오행', JSON.stringify(ratio) === JSON.stringify(c.expected.ratio), JSON.stringify(ratio), JSON.stringify(c.expected.ratio)],
  ];

  console.log(`\n[${c.name}]`);
  for (const [label, ok, got, want] of checks) {
    if (!ok) failed += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}: ${got}${ok ? '' : ` (기대값 ${want})`}`);
  }
}

if (failed > 0) {
  throw new Error(`${failed}개 검증 실패`);
}
console.log('\n모든 검증 통과');
