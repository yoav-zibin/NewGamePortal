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
it('Should update the match state', done => {
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

  const info: MatchInfo = {
    matchId: 'matchId3470079098562955xxxx',
    game: {
      gameSpecId: 'something',
      gameName: 'someGameName',
      screenShoot: {
        imageId: '',
        width: 100,
        height: 100,
        isBoardImage: false,
        downloadURL: 'blabla.png'
      }
    },
    participantsUserIds: [],
    lastUpdatedOn: 0
  };
  ourFirebase.updateMatchState(info, state).then(() => {
    firebase
      .database()
      .ref(
        `gamePortal/matches/${info.matchId}/pieces/${
          state.currentImageIndex
        }/currentState`
      )
      .once('value')
      .then((snapshot: DeltaSnapshot) => {
        expect(snapshot.val()).toEqual(state);
        done();
      });
  });
});

// xit means the test is eXcluded (i.e., disabled).
xit('TODO: delete eventually. Just checking things work in firebase.', () => {
  prettyJson(firebase.auth().currentUser);
  firebase
    .database()
    .ref('gameBuilder/gameSpecs')
    .limitToFirst(1)
    .once('value', snap => {
      // console.log(prettyJson(snap.val()));
    });
});

it('adds a new match in firebase', () => {
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
  ourFirebase.createMatch(gameInfo);
});

it('addFcmTokens', () => {
  ourFirebase.addFcmToken('1'.repeat(140), 'android');
});
