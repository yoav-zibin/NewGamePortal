export function checkCondition(desc: string, cond: any) {
  if (!cond) {
    throw new Error('Condition check failed for: ' + desc);
  }
}
