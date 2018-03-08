/**
 * @jest-environment node
 */
import { ourFirebase } from './firebase';
import * as firebase from 'firebase';
import {
  MatchState,
  MatchInfo,
  GameInfo,
  UserIdsAndPhoneNumbers
} from '../types/index';
import { store, dispatch } from '../stores';

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
const existingUserId = '0E25lvSVm5bTHrQT517kPafiAia2';
// Since our test use anonymous login
// and the rules only allow you to write there if you have auth.token.phone_number
// we can not add in gamePortal/PhoneNumberToUserId/${phoneNumber}
// So firebase rules add "123456789" for test
const magicPhoneNumberForTest = '123456789';

function createMatch() {
  return ourFirebase.createMatch(gameInfo, {});
}

// Must be the first test: signs in anonyously, writeUser,
// and other methods that can be called just once.
it('signInAnonymously finished successfully', done => {
  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      ourFirebase.writeUser(magicPhoneNumberForTest);
      ourFirebase.listenToMyMatchesList();
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
  // take match state and matchinfo
  const state: MatchState = {
    '0': {
      x: 100,
      y: 100,
      zDepth: 1,
      currentImageIndex: 0,
      cardVisibility: { '0': true }
    }
  };
  const match: MatchInfo = createMatch();
  ourFirebase.updateMatchState(match, state);
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
  const phoneNumbers: string[] = [
    '+2346523475',
    'nonExistingNumber1',
    magicPhoneNumberForTest,
    'nonExistingNumber2'
  ];
  phoneNumbers.push(magicPhoneNumberForTest);
  ourFirebase.updateUserIdsAndPhoneNumbers(phoneNumbers);
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
