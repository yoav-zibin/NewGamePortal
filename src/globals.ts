import {
  IdIndexer,
  Opponent,
  PlatformType,
  MatchInfo,
  PhoneNumInfo,
  UserIdToInfo
} from './types';

require('./js/trans-compiled');
declare function parsePhoneNumber(
  phoneNumber: String,
  regionCode: String
): PhoneNumInfo;

export function checkPhoneNumber(
  phoneNumber: String,
  regionCode: String
): PhoneNumInfo | null {
  try {
    return parsePhoneNumber(phoneNumber, regionCode);
  } catch (e) {
    return null;
  }
}

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
  for (let [_key, val] of Object.entries(obj)) {
    vals.push(val);
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
  userIdToInfo: UserIdToInfo
): Opponent[] {
  const opponentIds = getOpponentIds(participantsUserIds, myUserId);
  return opponentIds.map(userId => ({
    userId: userId,
    name: mapUserIdToName(userId, userIdToInfo)
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

export const UNKNOWN_NAME = 'Unknown name';
export function mapUserIdToName(
  userId: string,
  userIdToInfo: UserIdToInfo
): string {
  const info = userIdToInfo[userId];
  if (info) {
    return info.displayName;
  }
  return UNKNOWN_NAME;
}

export function findMatch(
  matchesList: MatchInfo[],
  matchId: string
): MatchInfo | undefined {
  return matchesList.find(match => match.matchId === matchId);
}

export function getPhoneNumberToUserInfo(
  userIdToInfo: UserIdToInfo
): UserIdToInfo {
  const phoneNumberToUserInfo: UserIdToInfo = {};
  for (let [_userId, userInfo] of Object.entries(userIdToInfo)) {
    const phoneNumber = userInfo.phoneNumber;
    if (phoneNumber) {
      phoneNumberToUserInfo[phoneNumber] = userInfo;
    }
  }
  return phoneNumberToUserInfo;
}

if (!Object.entries) {
  Object.entries = function(obj: any) {
    var ownProps = Object.keys(obj),
      i = ownProps.length,
      resArray = new Array(i); // preallocate the Array
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
}
if (!Object.freeze) {
  Object.freeze = (o: any) => o;
}
