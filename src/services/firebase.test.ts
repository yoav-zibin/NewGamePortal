/**
 * @jest-environment node
 */
import { ourFirebase } from './firebase';
import * as firebase from 'firebase';

const testConfig = {
  apiKey: 'AIzaSyA_UNWBNj7zXrrwMYq49aUaSQqygDg66SI',
  authDomain: 'testproject-a6dce.firebaseapp.com',
  databaseURL: 'https://testproject-a6dce.firebaseio.com',
  projectId: 'testproject-a6dce',
  storageBucket: 'testproject-a6dce.appspot.com',
  messagingSenderId: '957323548528'
};
ourFirebase.init(testConfig);
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

function prettyJson(obj: any): string {
  return JSON.stringify(obj, null, '  ');
}

// Must be the first test: signs in anonyously.
it('signInAnonymously finished successfully', done => {
  console.error('running signInAnonymously');
  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      console.error('finished signInAnonymously');
      done();
    })
    .catch(err => {
      console.error('error in signInAnonymously with err=', err);
      throw new Error('error in signInAnonymously err=' + err);
    });
});

// Must be the second test: writes the user data to gamePortal/gamePortalUsers/<user.uid>
it('writeUser succeeds', done => {
  console.error('running writeUser');
  const user = firebase.auth().currentUser;
  expect(user).toBeDefined();
  ourFirebase.writeUser().then(() => {
    done();
  });
});

it('TODO: delete eventually. Just checking things work in firebase.', () => {
  prettyJson(firebase.auth().currentUser);
  firebase
    .database()
    .ref('gameBuilder/gameSpecs')
    .limitToFirst(1)
    .once('value', snap => {
      console.log(prettyJson(snap.val()));
    });
});

it('addFcmTokens', () => {
  const userObj: fbr.GamePortalUser = {
    privateFields: {
      createdOn: <any>firebase.database.ServerValue.TIMESTAMP,
      phoneNumber: '',
      fcmTokens: {}
    },
    privateButAddable: {
      matchMemberships: {},
      signals: {}
    }
  };
  const uid = firebase.auth().currentUser!.uid;
  firebase
    .database()
    .ref(`gamePortal/gamePortalUsers/${uid}`)
    .set(userObj);

  const fcmToken: string = '1234';
  const platform = 'ios';

  const fcmTokenObj: fbr.FcmToken = {
    lastTimeReceived: <any>firebase.database.ServerValue.TIMESTAMP,
    platform: platform
  };
  firebase
    .database()
    .ref(
      `gamePortal/gamePortalUsers/${uid}/privateFields/fcmTokens/${fcmToken}`
    )
    .set(fcmTokenObj);
});
