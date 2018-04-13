import {
  IdIndexer,
  UserIdToPhoneNumber,
  PhoneNumberToContact,
  Opponent,
  PlatformType
} from './types';

export const platform: PlatformType =
  typeof window === 'undefined'
    ? 'tests'
    : window.location.search === '?platform=ios'
      ? 'ios'
      : window.location.search === '?platform=android' ? 'android' : 'web';
export const isTests = platform === 'tests';
export const isIos = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb = platform === 'web';

export function checkCondition(desc: any, cond: boolean | Object) {
  if (!cond) {
    throw new Error('Condition check failed for: ' + JSON.stringify(desc));
  }
  return cond;
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

export function getOpponents(
  participantsUserIds: string[],
  myUserId: string,
  userIdToPhoneNumber: UserIdToPhoneNumber,
  phoneNumberToContact: PhoneNumberToContact
): Opponent[] {
  const opponentIds = getOpponentIds(participantsUserIds, myUserId);
  return opponentIds.map(userId => ({
    userId: userId,
    name: mapUserIdToName(userId, userIdToPhoneNumber, phoneNumberToContact)
  }));
}

export function getOpponentIds(
  participantsUserIds: string[],
  myUserId: string
): string[] {
  const opponentIds = participantsUserIds.concat();
  const myIndex = participantsUserIds.indexOf(myUserId);
  opponentIds.splice(myIndex, 1);
  return opponentIds;
}

export function mapUserIdToName(
  userId: string,
  userIdToPhoneNumber: UserIdToPhoneNumber,
  phoneNumberToContact: PhoneNumberToContact
): string {
  const phone: string = userIdToPhoneNumber[userId];
  if (phone) {
    const contact = phoneNumberToContact[phone];
    if (contact) {
      return contact.name;
    }
  }
  return 'Unknown contact';
}
