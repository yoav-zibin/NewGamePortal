import { IdIndexer } from './types';

export function checkCondition(desc: string, cond: any) {
  if (!cond) {
    throw new Error('Condition check failed for: ' + desc);
  }
}

export function getValues<T>(obj: IdIndexer<T>): T[] {
  let vals: T[] = [];
  for (let key of Object.keys(obj)) {
    vals.push(obj[key]);
  }
  return vals;
}

export function prettyJson(obj: any): string {
  return JSON.stringify(obj, null, '  ');
}
