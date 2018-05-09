/**
 * @jest-environment node
 */

(global as any).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

import { ourFirebase } from './firebase';
import {
  MatchInfo,
  PhoneNumberToContact,
  GameSpecs,
  UserInfo
} from '../types/index';
import { store } from '../stores';
import {
  checkCondition,
  prettyJson,
  findMatch,
  deepCopy,
  platform
} from '../globals';
import { MatchStateHelper } from './matchStateHelper';

const testConfig = {
  apiKey: 'AIzaSyA_UNWBNj7zXrrwMYq49aUaSQqygDg66SI',
  authDomain: 'testproject-a6dce.firebaseapp.com',
  databaseURL: 'https://testproject-a6dce.firebaseio.com',
  projectId: 'testproject-a6dce',
  storageBucket: 'testproject-a6dce.appspot.com',
  messagingSenderId: '957323548528'
};
ourFirebase.allPromisesForTests = [];
ourFirebase.init(testConfig);

// If you remove all gamePortalUsers, then remember to create one for the test.
const existingUserId = 'wnSB3rTfCLRHkgfGM6jZtaw7EpB3';

function createMatch() {
  const state = store.getState();
  const gamesList = state.gamesList;
  const gameInfo = gamesList.find(gameInList =>
    gameInList.gameName.includes('opoly')
  )!;
  return ourFirebase.createMatch(gameInfo);
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (var i = 0; i < a.length; ++i) {
    if (!deepEquals(a[i], b[i])) {
      return false;
    }
  }
  return true;
}
function deepEquals(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return arraysEqual(<any>a, <any>b);
  }
  if (typeof a === 'object' || typeof b === 'object') {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) {
      return false;
    }
    for (let key of keys) {
      if (!deepEquals(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function expectEqual<T>(actual: T, expected: T) {
  if (!deepEquals(actual, expected)) {
    console.error('expectEqual: actual=', actual, ' expected=', expected);
    throw new Error(
      'expectEqual: actual=' +
        JSON.stringify(actual) +
        ' expected=' +
        JSON.stringify(expected)
    );
  }
}

function checkGameSpecs(gameSpecs: GameSpecs) {
  const {
    elementIdToElement,
    imageIdToImage,
    gameSpecIdToGameSpec
  } = gameSpecs;
  Object.keys(gameSpecIdToGameSpec).forEach(gameSpecId => {
    const gameSpec = gameSpecIdToGameSpec[gameSpecId];
    expectEqual(gameSpec.board, imageIdToImage[gameSpec.board.imageId]);
    expectEqual(gameSpec.board.isBoardImage, true);
    gameSpec.pieces.forEach(piece => {
      expectEqual(piece.element, elementIdToElement[piece.element.elementId]);
      if (piece.deckPieceIndex !== -1) {
        checkCondition(
          'piece must be a card to have deckPieceIndex: gameSpecId=' +
            gameSpecId +
            ' piece=' +
            prettyJson(piece),
          piece.element.elementKind === 'card'
        );
        const deck = gameSpec.pieces[piece.deckPieceIndex].element;
        checkCondition(
          'deckPieceIndex points to a deck',
          deck.elementKind.endsWith('Deck')
        );
      }
    });
  });
  Object.keys(elementIdToElement).forEach(elementId => {
    const element = elementIdToElement[elementId];
    element.images.forEach(image => {
      expectEqual(image, imageIdToImage[image.imageId]);
    });
    // Some checks based on the element kind
    switch (element.elementKind) {
      case 'standard':
        checkCondition(
          'standard piece has 1 image',
          element.images.length === 1
        );
        break;
      case 'toggable':
      case 'dice':
        checkCondition(
          'toggable|diece piece has 1 or more images',
          element.images.length >= 1
        );
        break;
      case 'card':
        checkCondition('card piece has 2 images', element.images.length === 2);
        break;
      case 'cardsDeck':
      case 'piecesDeck':
        checkCondition('deck has 1 image', element.images.length === 1);
        break;
      default:
        checkCondition('Illegal elementKind', false);
        break;
    }
  });
}

const numOfSpecsToFetch = 2;
function fetchSomeGameSpecs() {
  const gamesList = store.getState().gamesList;
  expectEqual(gamesList.length > 150, true);
  for (let i = 0; i < numOfSpecsToFetch; i++) {
    ourFirebase.createMatch(gamesList[i]);
  }
  // gamesList.forEach(g => ourFirebase.createMatch(g));
}

function getAllPromisesForTests() {
  return Promise.all(ourFirebase.allPromisesForTests!).catch(e =>
    console.error('Failed promise=', e)
  );
}

// Since our test use anonymous login
// and the rules only allow you to write there if you have auth.token.phone_number
// we can not add in gamePortal/PhoneNumberToUserId/${phoneNumber}
// So firebase rules add "+1111111111[0-9]" for test
const magicPhoneNumberForTest = '+11111111111';

function doBeforeAll(done: () => void) {
  console.log('beforeAll: call signInAnonymously');
  ourFirebase.signInAnonymously(magicPhoneNumberForTest, 'Unit tests user');
  getAllPromisesForTests().then(() => {
    // We need to do it twice because after all our promises resolved, we created some more.
    getAllPromisesForTests().then(() => {
      fetchSomeGameSpecs();
      getAllPromisesForTests().then(() => {
        const state = store.getState();
        checkGameSpecs(state.gameSpecs);
        // expectEqual(
        //   numOfSpecsToFetch, // state.gamesList.length,
        //   Object.keys(state.gameSpecs.gameSpecIdToGameSpec).length
        // );
        done();
      });
    });
  });
}
function doAfterAll(done: () => void) {
  getAllPromisesForTests().then(done);
}

if (platform === 'tests') {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  (<any>jasmine).getEnv().addReporter({
    specStarted: function(result: any) {
      console.log(result.fullName);
    }
  });
  beforeAll(doBeforeAll);
  afterEach(doAfterAll);
} else {
  (<any>window).it = () => 42;
}

export function runTestsInBrowser() {
  doBeforeAll(() => {
    createMatch();
    doAfterAll(() => console.error('All done running test'));
  });
}

it('adds a new match in firebase', () => {
  createMatch();
});

it('Should update the match state', () => {
  const match: MatchInfo = deepCopy(createMatch());
  const matchStateHelper = new MatchStateHelper(match);
  const spec = matchStateHelper.spec;
  matchStateHelper.resetMatch();
  ourFirebase.updateMatchState(match);

  const piece = spec.pieces.find(p => p.element.elementKind === 'card')!;
  const pieceIndex = spec.pieces.indexOf(piece);
  matchStateHelper.showMe(pieceIndex);
  ourFirebase.updateMatchState(match);

  matchStateHelper.showEveryone(pieceIndex);
  ourFirebase.updatePieceState(match, pieceIndex);
});

it('addFcmTokens', () => {
  ourFirebase.addFcmToken('1'.repeat(140), 'android');
});

it('addParticipants', () => {
  const match: MatchInfo = createMatch();
  ourFirebase.addParticipant(match, existingUserId);
  expectEqual(
    findMatch(
      store.getState().matchesList,
      match.matchId
    )!.participantsUserIds.indexOf(existingUserId) !== -1,
    true
  );
});

it('fetch match list from firebase', () => {
  const matchId = createMatch().matchId;
  const matchesList = store.getState().matchesList;
  const match = findMatch(matchesList, matchId)!;
  expectEqual(match.matchId, matchId);
});

it('Should update the phone numbers', done => {
  // write something to gameportal/phoneNumberToUserId
  // get string from contact and convert them to string
  const displayName = 'whatever name';
  const phoneNumbers: PhoneNumberToContact = {
    [magicPhoneNumberForTest]: {
      phoneNumber: magicPhoneNumberForTest,
      name: displayName
    },
    '+1234567890123456789': {
      phoneNumber: '+1234567890123456789',
      name:
        '………nameThatsVeryLong שם בעברית nameThatsVeryLong nameThatsVeryLong nameThatsVeryLong!'
    },
    '+666666': {
      phoneNumber: '+666666',
      name: 'name666666'
    }
  };
  ourFirebase.storeContacts(phoneNumbers);
  // check if store has been updated
  store.subscribe(() => {
    const userIdToInfo = store.getState().userIdToInfo;
    const uid = ourFirebase.getUserId();
    const expectedUserInfo: UserInfo = {
      userId: uid,
      phoneNumber: magicPhoneNumberForTest,
      displayName: displayName
    };
    if (userIdToInfo[uid]) {
      expectEqual(userIdToInfo[uid], expectedUserInfo);
      done();
    }
  });
});

it('pingOpponentsInMatch', () => {
  const match: MatchInfo = createMatch();
  ourFirebase.pingOpponentsInMatch(match);
});

it('leaveSinglePlayerMatch', () => {
  const match: MatchInfo = createMatch();
  ourFirebase.leaveMatch(match);
  expectEqual(
    findMatch(store.getState().matchesList, match.matchId) === undefined,
    true
  );
});

it('leaveMultiPlayerMatch', () => {
  const match: MatchInfo = createMatch();
  ourFirebase.addParticipant(match, existingUserId);
  ourFirebase.leaveMatch(match);
  expectEqual(
    findMatch(store.getState().matchesList, match.matchId) === undefined,
    true
  );
});

it('fetch signal list from firebase', done => {
  const userId = ourFirebase.getUserId();
  store.subscribe(() => {
    const signals = store.getState().signals;
    // if we can find signals in store, done
    signals.forEach(signal => {
      if (
        signal['addedByUid'] === userId &&
        signal['signalType'] === 'candidate' &&
        signal['signalData'] === 'hello'
      ) {
        done();
      }
    });
  });
  // send a signal
  ourFirebase.sendSignal(userId, 'candidate', 'hello');
});
