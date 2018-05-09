import {
  IdIndexer,
  Opponent,
  PlatformType,
  MatchInfo,
  PhoneNumInfo,
  UserIdToInfo,
  ContactWithUserId
} from './types';

require('./js/trans-compiled');
declare function parsePhoneNumber(
  phoneNumber: string,
  regionCode: string
): PhoneNumInfo;

// global Window class doesn't come with Image()
// so we have to add it ourselves
declare global {
  interface Window {
    cordova: any;
    device: any;
    sms: any;
    PushNotification: any;
  }
  interface Navigator {
    contacts: any;
  }
  interface Window {
    Image: {
      prototype: HTMLImageElement;
      new (): HTMLImageElement;
    };
  }
}

export function checkPhoneNumber(
  phoneNumber: string,
  regionCode: string
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
export const isApp = isIos || isAndroid;
export const isWeb = platform === 'web';

export function checkCondition(desc: any, cond: boolean) {
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
if (!Array.isArray) {
  Array.isArray = <any>function(arg: any) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}
if (!Object.freeze) {
  Object.freeze = (o: any) => o;
}

export function deepFreeze<T>(obj: T): T {
  return deepFreezeHelper(obj, new Set());
}
export function deepFreezeHelper<T>(obj: T, cycleDetector: Set<any>): T {
  checkForCycle(obj, cycleDetector);
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  for (let [_name, prop] of Object.entries(obj)) {
    // Freeze prop if it is an object
    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop);
    }
  }
  // Freeze self (no-op if already frozen)
  return Object.freeze(obj);
}

export function shallowCopy<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return <any>obj.concat();
  }
  return Object.assign({}, obj);
}
export function deepCopy<T>(obj: T): T {
  return deepCopyHelper(obj, new Set());
}
function checkForCycle(obj: any, cycleDetector: Set<any>) {
  if (cycleDetector.has(obj)) {
    throw new Error(
      'Found cycle containing obj=' +
        prettyJson(obj) +
        ' objects-traversed=' +
        prettyJson(cycleDetector)
    );
  }
  cycleDetector.add(obj);
}
function deepCopyHelper<T>(obj: T, cycleDetector: Set<any>): T {
  checkForCycle(obj, cycleDetector);
  let result: any = shallowCopy(obj);
  for (let [name, prop] of Object.entries(obj)) {
    if (typeof prop === 'object' && prop !== null) {
      result[name] = deepCopy(prop);
    }
  }
  return result;
}

export const studentsUsers: ContactWithUserId[] = [
  {
    userId: 'HIfpdxPucXXUEffw8V4yezzUtKv1',
    phoneNumber: '+19175730795',
    name: 'Yoav Zibin'
  },
  {
    userId: 'Kw9aO9pQSQYMKuTXcBGe3bT1qoh1',
    phoneNumber: '+17326476905',
    name: 'Herbert Li'
  },
  {
    userId: 'wbrj6fHArqUPw8ToKN4Y728oz6i1',
    phoneNumber: '+17187107933',
    name: 'Jiaqi Zou'
  },
  {
    userId: '3owDcSbVfPXeoBJG0clhqlXwfYQ2',
    phoneNumber: '+17185525029',
    name: 'Priyanka vaidya'
  },
  {
    userId: 'LaDyFTfdfXfMM4j0H9CzXDIwB9S2',
    phoneNumber: '+12038859211',
    name: 'Radhika Mattoo'
  },
  {
    userId: 'qeoTOlU2kBN0Uz4FfaO6cxNB05h2',
    phoneNumber: '+15513586613',
    name: 'Sisi Li'
  },
  {
    userId: 'lNSwl0Y5uMe4x8tA6uftkhqx8jC3',
    phoneNumber: '+19174021465',
    name: 'Yiwei Wu'
  }
];
