/**
 * @jest-environment node
 */
import { ourFirebase } from './firebase';
import * as firebase from 'firebase';
import {
  MatchState,
  MatchInfo,
  GameInfo,
  UserIdsAndPhoneNumbers,
  PhoneNumberToContact,
  GameSpec,
  Image,
  GameSpecs,
  Piece,
  Element,
  PieceState
} from '../types/index';
import { store, dispatch } from '../stores';
import { checkCondition } from '../globals';

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

afterEach(done => {
  Promise.all(ourFirebase.allPromisesForTests!).then(done);
});

// Using real gameSpecId (so no need to insert game spec into db).
// TODO: refactor this once fetchGamesList is implemented.
const gameInfo: GameInfo = {
  gameSpecId: '-KxLz3AY3-xB47ZXN9Az',
  gameName: '3 Man Chess',
  screenShoot: {
    imageId: '-KuXdJ2ZJPJ-Ad_k02Tf',
    downloadURL: 'https://someurl.com/foo.png',
    height: 1024,
    width: 700,
    isBoardImage: true
  }
};
dispatch({ setGamesList: [gameInfo] });

const image: Image = {
  imageId: 'someImageId',
  downloadURL: 'https://someurl.com/foo.png',
  height: 1024,
  width: 700,
  isBoardImage: true
};
const element: Element = {
  elementId: 'someElementId',
  elementKind: 'standard',
  images: [image],
  isDraggable: true,
  width: 100,
  height: 100
};
const pieceState: PieceState = {
  x: 0,
  y: 0,
  zDepth: 1,
  cardVisibility: {},
  currentImageIndex: 0
};
const piece: Piece = {
  deckPieceIndex: -1,
  element: element,
  initialState: pieceState
};
const gameSpec: GameSpec = {
  board: image,
  pieces: [piece]
};
const gameSpecs: GameSpecs = {
  imageIdToImage: {
    [image.imageId]: image
  },
  elementIdToElement: {
    [element.elementId]: element
  },
  gameSpecIdToGameSpec: {
    [gameInfo.gameSpecId]: gameSpec
  }
};
dispatch({ updateGameSpecs: gameSpecs });

const existingUserId = '0E25lvSVm5bTHrQT517kPafiAia2';

function createMatch() {
  return ourFirebase.createMatch(gameInfo, [pieceState]);
}

// Must be the first test: signs in anonyously, writeUser,
// and other methods that can be called just once.
it('signInAnonymously finished successfully', done => {
  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      ourFirebase.writeUser(ourFirebase.magicPhoneNumberForTest);
      done();
    })
    .catch(err => {
      console.error('error in signInAnonymously with err=', err);
      throw new Error('error in signInAnonymously err=' + err);
    });
});

it('adds a new match in firebase', () => {
  createMatch();
});

it('Should update the match state', () => {
  const state: MatchState = [
    {
      x: 100,
      y: 100,
      zDepth: 1,
      currentImageIndex: 0,
      cardVisibility: { '0': true }
    }
  ];
  const match: MatchInfo = createMatch();
  ourFirebase.updateMatchState(match, state);
});

it('Should update the piece state', () => {
  const newPieceState: PieceState = {
    x: 55,
    y: 55,
    zDepth: 200,
    currentImageIndex: 0,
    cardVisibility: { '0': true }
  };
  const match: MatchInfo = createMatch();
  ourFirebase.updatePieceState(match, 0, newPieceState);
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

// TODO: check once.
xit('fetchAllGameSpecs', done => {
  store.subscribe(() => {
    const gamesList = store.getState().gamesList;
    if (gamesList.length > 0) {
      checkCondition('>170 games', gamesList.length > 170);
    }
    gamesList.forEach(g => ourFirebase.fetchGameSpec(g));
    done();
  });
});
