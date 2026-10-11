export function isDailyActionDone(actionKey: string): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    return typeof localStorage !== 'undefined' && localStorage.getItem(`cyber_saju_${actionKey}_${today}`) === 'done';
  } catch {
    return false;
  }
}

export function setDailyActionDone(actionKey: string): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`cyber_saju_${actionKey}_${today}`, 'done');
    }
  } catch {}
}
