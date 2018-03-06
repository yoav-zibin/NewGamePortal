/**
 * @jest-environment node
 */
import { ourFirebase } from './firebase';
import * as firebase from 'firebase';
import { MatchState, MatchInfo, GameInfo } from '../types/index';

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

function prettyJson(obj: any): string {
  return JSON.stringify(obj, null, '  ');
}

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

// Must be the first test: signs in anonyously.
it('signInAnonymously finished successfully', done => {
  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      done();
    })
    .catch(err => {
      console.error('error in signInAnonymously with err=', err);
      throw new Error('error in signInAnonymously err=' + err);
    });
});

// Must be the second test: writes the user data to gamePortal/gamePortalUsers/<user.uid>
it('writeUser succeeds', () => {
  const user = firebase.auth().currentUser;
  expect(user).toBeDefined();
  ourFirebase.writeUser();
});

// xit means the test is eXcluded (i.e., disabled).
xit('TODO: delete eventually. Just checking things work in firebase.', () => {
  prettyJson(firebase.auth().currentUser);
  firebase
    .database()
    .ref('gameBuilder/gameSpecs')
    .limitToFirst(1)
    .once('value', snap => {
      console.log(prettyJson(snap.val()));
    });
});

it('adds a new match in firebase', () => {
  ourFirebase.createMatch(gameInfo);
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
  const info: MatchInfo = ourFirebase.createMatch(gameInfo);
  ourFirebase.updateMatchState(info, state);
});

it('addFcmTokens', () => {
  ourFirebase.addFcmToken('1'.repeat(140), 'android');
});

it('addParticipants', () => {
  const info: MatchInfo = ourFirebase.createMatch(gameInfo);
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in');
  }
  const userId = currentUser.uid;
  ourFirebase.addParticipant(info, userId);
});

it('fetch match list from firebase', () => {
  console.log('Testing fetch match list....');
  // Create a new match
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in');
  }
  const userId = currentUser.uid;
  console.log('UserId is:' + userId);
  const participants: fbr.Participants = {};
  participants[userId] = {
    participantIndex: 0,
    pingOpponents: ourFirebase.getTimestamp()
  };
  const matchInfo: fbr.Match = {
    participants,
    createdOn: ourFirebase.getTimestamp(),
    lastUpdatedOn: ourFirebase.getTimestamp(),
    gameSpecId: '-L-E8g38ZSbq5jhGT8rS',
    pieces: {
      0: {
        currentState: {
          x: 1,
          y: 1,
          zDepth: 1,
          currentImageIndex: 1,
          cardVisibility: {
            0: true
          },
          rotationDegrees: 90,
          drawing: {}
        }
      }
    }
  };

  const matchRef = firebase
    .database()
    .ref('/gamePortal/matches')
    .push();
  const matchId = matchRef.key!;
  console.log('The match id is:' + matchId);
  const matchValue = matchInfo;
  ourFirebase.refSet(matchRef, matchValue);

  const ref = firebase
    .database()
    .ref(
      '/gamePortal/gamePortalUsers/' +
        userId +
        '/privateButAddable/matchMemberships'
    )
    .child(matchId);
  const value = {
    addedByUid: userId,
    timestamp: ourFirebase.getTimestamp()
  };
  ourFirebase.refSet(ref, value);

  ourFirebase.listenToMyMatchesList();
  // console.log(userId + 'In Test');
});
