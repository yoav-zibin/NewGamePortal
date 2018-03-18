import { IdIndexer } from './types';

export function checkCondition(desc: string, cond: any) {
  if (!cond) {
    throw new Error('Condition check failed for: ' + desc);
  }
}

export function checkNotNull<T>(val: T): T {
  checkCondition('checkNotNull', val !== undefined && val !== null);
  return val;
}

export function getValues<T>(obj: IdIndexer<T>): T[] {
  let vals: T[] = [];
  for (let key of Object.keys(obj)) {
    vals.push(obj[key]);
  }
  return vals;
}

export function objectMap<T, U>(
  o: IdIndexer<T>,
  f: (t: T, id: string) => U
): IdIndexer<U> {
  const res: IdIndexer<U> = {};
  Object.keys(o).forEach(k => (res[k] = f(o[k], k)));
  return res;
}

export function prettyJson(obj: any): string {
  return JSON.stringify(obj, null, '  ');
}
