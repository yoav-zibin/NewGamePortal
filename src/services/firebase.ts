// import { Contact } from '../types/index';
import { store, dispatch } from '../stores';
import * as firebase from 'firebase';
import { checkCondition } from '../globals';
import { Action } from '../reducers';
import { BooleanIndexer, MatchInfo, GameInfo } from '../types';

function prettyJson(obj: any): string {
  return JSON.stringify(obj, null, '  ');
}

// All interactions with firebase must be in this module.
export namespace ourFirebase {
  // We're using redux, so all state must be stored in the store.
  // I.e., we can't have any state/variables/etc that is used externally.
  let calledFunctions: BooleanIndexer = {};
  function checkFunctionIsCalledOnce(functionName: string) {
    checkCondition('checkFunctionIsCalledOnce', !calledFunctions[functionName]);
    calledFunctions[functionName] = true;
  }

  // Call init exactly once to connect to firebase.
  export function init(testConfig?: Object) {
    // Initialize Firebase
    let config = {
      apiKey: 'AIzaSyDA5tCzxNzykHgaSv1640GanShQze3UK-M',
      authDomain: 'universalgamemaker.firebaseapp.com',
      databaseURL: 'https://universalgamemaker.firebaseio.com',
      projectId: 'universalgamemaker',
      storageBucket: 'universalgamemaker.appspot.com',
      messagingSenderId: '144595629077'
    };
    firebase.initializeApp(testConfig ? testConfig : config);
  }

  // TODO: delete
  export function exampleDispatch() {
    const action: Action = {
      setGamesList: []
    };
    dispatch(action);
  }

  // See https://firebase.google.com/docs/auth/web/phone-auth
  export function signInWithPhoneNumber(
    phoneNumber: string,
    applicationVerifier: firebase.auth.ApplicationVerifier
  ): Promise<any> {
    checkFunctionIsCalledOnce('signInWithPhoneNumber');
    // TODO: create or update /gamePortal/gamePortalUsers/$myUserId
    // TODO: set recaptcha
    return firebase
      .auth()
      .signInWithPhoneNumber(phoneNumber, applicationVerifier);
  }

  export function getTimestamp(): number {
    return <number>firebase.database.ServerValue.TIMESTAMP;
  }

  export function writeUser() {
    checkFunctionIsCalledOnce('writeUser');
    const user = assertLoggedIn();
    const userFbr: fbr.GamePortalUser = {
      privateButAddable: {
        signals: {},
        matchMemberships: {}
      },
      privateFields: {
        createdOn: getTimestamp(),
        fcmTokens: {},
        phoneNumber: user.phoneNumber ? user.phoneNumber : ''
      }
    };
    return (
      db()
        .ref(`gamePortal/gamePortalUsers/${user.uid}`)
        // TODO: use transact to ensure we don't override an existing user and deleting data.
        .set(userFbr)
    );
  }

  // Eventually dispatches the action setGamesList.
  export function setGamesList() {
    checkFunctionIsCalledOnce('setGamesList');
    assertLoggedIn();
    // TODO: implement.
    db()
      .ref('TODO')
      .once('value', gotGamesList);
  }

  // Eventually dispatches the action setMatchesList
  // every time this field is updated:
  //  /gamePortal/gamePortalUsers/$myUserId/privateButAddable/matchMemberships
  export function listenToMyMatchesList() {
    checkFunctionIsCalledOnce('listenToMyMatchesList');
    const user = assertLoggedIn();
    db()
      .ref(
        `gamePortal/gamePortalUsers${
          user.uid
        }/privateButAddable/matchMemberships`
      )
      .on('value', snap => getMatchMemberships(snap ? snap.val() : {}));
  }

  function getMatchMemberships(matchMemberships: fbr.MatchMemberships) {
    const matchIds = Object.keys(matchMemberships);
    // TODO: get all matches in one call to firebase, then later call dispatch.
    // Make sure we listen to match changes only once.
    // 'gamePortal/matches'
    // store.dispatch(updateMatchList);
    db().ref('gamePortal/matches' + matchIds); // TODO
  }

  // TODO: make sure we call certain functions only once (checkFunctionIsCalledOnce).

  // TODO: export function updateGameSpec(game: GameInfo) {}

  export function createMatch(game: GameInfo): MatchInfo {
    const user = assertLoggedIn();
    const ref = db()
      .ref('gamePortal/matches')
      .push();
    const participants: fbr.Participants = {};
    participants[user.uid] = {
      participantIndex: 0,
      pingOpponents: <number>firebase.database.ServerValue.TIMESTAMP
    };
    const newFBMatch: fbr.Match = {
      gameSpecId: game.gameSpecId,
      participants: participants,
      createdOn: <number>firebase.database.ServerValue.TIMESTAMP,
      lastUpdatedOn: <number>firebase.database.ServerValue.TIMESTAMP,
      pieces: {}
    };
    ref.set(newFBMatch);
    const newMatch: MatchInfo = {
      matchId: ref.key!,
      game: game,
      participantsUserIds: [user.uid],
      lastUpdatedOn: newFBMatch.lastUpdatedOn,
      matchState: {}
    };
    console.log(prettyJson(newMatch));
    // TODO: dispatch a createMatch action
    return newMatch;
  }

  // TODO: export function addParticipant(match: MatchInfo, user: User) {}
  // TODO: export function updateMatchState(match: MatchInfo, matchState: MatchState) {}
  // TODO: export function pingOpponentsInMatch(match: MatchInfo) {}

  // Dispatches updateUserIdsAndPhoneNumbers (reading from /gamePortal/phoneNumberToUserId)
  // TODO: export function updateUserIdsAndPhoneNumbers(phoneNumbers: string[]) {}

  // TODO: export function addFcmToken(fcmToken: string, platform: 'ios'|'android') {}

  // Dispatches setSignals.
  // TODO: export function listenToSignals() {}

  // TODO: export function sendSignal(toUserId: string, signalType: 'sdp'|'candidate', signalData: string;) {}

  /////////////////////////////////////////////////////////////////////////////
  // All the non-exported functions (i.e., private functions).
  /////////////////////////////////////////////////////////////////////////////

  function gotGamesList(snap: firebase.database.DataSnapshot) {
    // TODO: create updateGameListAction + reducers etc.
    let updateGameListAction: any = snap.val(); // TODO: change this.
    // TODO2 (after other TODOs are done): handle screenshotImageId
    // firebase.storage().ref('images/blabla.jpg').getDownloadURL()
    store.dispatch(updateGameListAction);
  }

  function assertLoggedIn(): firebase.User {
    const user = currentUser();
    if (!user) {
      throw new Error('You must be logged in');
    }
    return user;
  }

  function currentUser() {
    return firebase.auth().currentUser;
  }

  function db() {
    return firebase.database();
  }
}
