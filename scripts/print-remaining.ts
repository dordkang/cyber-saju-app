import { calculateRemainingMonthsFortune, calculateYearFortune } from '../src/engine/timelineEngine';

const opts = { birthTime: '05:00', gender: 'male' as const, calendarType: 'solar' as const };
const ref = '2026-10-07';

const y = calculateYearFortune('1975-06-11', 2026, ['wealth', 'business', 'love', 'children', 'health'], 70, {
  ...opts,
  referenceDate: ref,
});
console.log('=== 2026 연운 ===');
console.log(JSON.stringify(y, null, 1));

const months = calculateRemainingMonthsFortune('1975-06-11', ref, {
  ...opts,
  interests: ['wealth', 'business', 'love', 'children', 'health'],
  lifeSyncRatio: 70,
});
console.log('\n=== 남은 월운 ===');
console.log(JSON.stringify(months, null, 1));
