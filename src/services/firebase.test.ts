/**
 * @jest-environment node
 */
import { ourFirebase } from './firebase';
import {
  MatchInfo,
  UserIdsAndPhoneNumbers,
  PhoneNumberToContact,
  GameSpecs
} from '../types/index';
import { store } from '../stores';
import { checkCondition, prettyJson } from '../globals';
import { MatchStateHelper } from './matchStateHelper';

const testConfig = {
  apiKey: 'AIzaSyA_UNWBNj7zXrrwMYq49aUaSQqygDg66SI',
  authDomain: 'testproject-a6dce.firebaseapp.com',
  databaseURL: 'https://testproject-a6dce.firebaseio.com',
  projectId: 'testproject-a6dce',
  storageBucket: 'testproject-a6dce.appspot.com',
  messagingSenderId: '957323548528'
};
ourFirebase.init(testConfig);
ourFirebase.allPromisesForTests = [];
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
(<any>jasmine).getEnv().addReporter({
  specStarted: function(result: any) {
    console.log(result.fullName);
  }
});

// If you remove all gamePortalUsers, then remember to create one for the test.
const existingUserId = '1DkjALsO65UkFT68kE7Ll5LYkET2';

function createMatch() {
  const state = store.getState();
  const gamesList = state.gamesList;
  const gameInfo = gamesList.find(gameInList =>
    gameInList.gameName.includes('opoly')
  )!;
  return ourFirebase.createMatch(gameInfo);
}

function checkGameSpecs(gameSpecs: GameSpecs) {
  const {
    elementIdToElement,
    imageIdToImage,
    gameSpecIdToGameSpec
  } = gameSpecs;
  Object.keys(gameSpecIdToGameSpec).forEach(gameSpecId => {
    const gameSpec = gameSpecIdToGameSpec[gameSpecId];
    expect(gameSpec.board).toEqual(imageIdToImage[gameSpec.board.imageId]);
    expect(gameSpec.board.isBoardImage).toBe(true);
    gameSpec.pieces.forEach(piece => {
      expect(piece.element).toEqual(
        elementIdToElement[piece.element.elementId]
      );
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
      expect(image).toEqual(imageIdToImage[image.imageId]);
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

function fetchAllGameSpecs() {
  const gamesList = store.getState().gamesList;
  expect(gamesList.length).toEqual(183);
  gamesList.forEach(g => ourFirebase.createMatch(g));
}

function getAllPromisesForTests() {
  return Promise.all(ourFirebase.allPromisesForTests!);
}

beforeAll(done => {
  ourFirebase
    .signInAnonymously()
    .then(() => {
      getAllPromisesForTests().then(() => {
        fetchAllGameSpecs();
        getAllPromisesForTests().then(() => {
          const state = store.getState();
          checkGameSpecs(state.gameSpecs);
          expect(state.gamesList.length).toEqual(
            Object.keys(state.gameSpecs.gameSpecIdToGameSpec).length
          );
          done();
        });
      });
    })
    .catch(err => {
      console.error('error in signInAnonymously with err=', err);
      throw new Error('error in signInAnonymously err=' + err);
    });
});

afterEach(done => {
  getAllPromisesForTests().then(done);
});

it('adds a new match in firebase', () => {
  createMatch();
});

it('Should update the match state', () => {
  const match: MatchInfo = createMatch();
  const matchStateHelper = new MatchStateHelper(match);
  const spec = matchStateHelper.spec;
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

it('addParticipants', done => {
  const match: MatchInfo = createMatch();
  ourFirebase.addParticipant(match, existingUserId);
  store.subscribe(() => {
    const matchesList = store.getState().matchesList;
    const thisMatch = matchesList.find(
      matchInList => matchInList.matchId === match.matchId
    );
    if (
      thisMatch &&
      thisMatch.participantsUserIds.indexOf(existingUserId) !== -1
    ) {
      done();
    }
  });
});

it('fetch match list from firebase', done => {
  const matchId = createMatch().matchId;
  store.subscribe(() => {
    const matchesList = store.getState().matchesList;
    if (matchesList.find(match => match.matchId === matchId)) {
      done();
    }
  });
});

it('Should update the phone numbers', done => {
  // write something to gameportal/phoneNumberToUserId
  // get string from contact and convert them to string
  const magicPhoneNumberForTest = ourFirebase.magicPhoneNumberForTest;
  const phoneNumbers: PhoneNumberToContact = {
    [magicPhoneNumberForTest]: {
      phoneNumber: magicPhoneNumberForTest,
      name: 'name'
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
    const userIdsAndPhoneNumbers = store.getState().userIdsAndPhoneNumbers;
    const uid = ourFirebase.getUserId();
    const expectedUserIdsAndPhoneNumbers: UserIdsAndPhoneNumbers = {
      phoneNumberToUserId: { [magicPhoneNumberForTest]: uid },
      userIdToPhoneNumber: { [uid]: magicPhoneNumberForTest }
    };
    if (userIdsAndPhoneNumbers.phoneNumberToUserId[magicPhoneNumberForTest]) {
      expect(userIdsAndPhoneNumbers).toEqual(expectedUserIdsAndPhoneNumbers);
      done();
    }
  });
});

it('pingOpponentsInMatch', () => {
  const match: MatchInfo = createMatch();
  ourFirebase.pingOpponentsInMatch(match);
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
