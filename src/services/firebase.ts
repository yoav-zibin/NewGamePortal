// import { Contact } from '../types/index';
import { dispatch } from '../stores';
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
  let myCountryCode = '';
  export function signInWithPhoneNumber(
    phoneNumber: string,
    countryCode: string,
    applicationVerifier: firebase.auth.ApplicationVerifier
  ): Promise<any> {
    checkFunctionIsCalledOnce('signInWithPhoneNumber');
    myCountryCode = countryCode;
    // Eventually call writeUser.
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
    const userFbr: fbr.PrivateFields = {
      createdOn: getTimestamp(),
      fcmTokens: {},
      phoneNumber: user.phoneNumber ? user.phoneNumber : '',
      countryCode: myCountryCode
    };
    delete userFbr.fcmTokens; // I don't want to update these.
    refUpdate(
      getRef(`/gamePortal/gamePortalUsers/${user.uid}/privateFields`),
      userFbr
    );

    const phoneNumberFbr: fbr.PhoneNumber = {
      userId: user.uid,
      timestamp: getTimestamp()
    };
    if (user.phoneNumber) {
      refSet(
        getRef(`/gamePortal/phoneNumberToUserId${user.phoneNumber}`),
        phoneNumberFbr
      );
    }
  }

  // Eventually dispatches the action setGamesList.
  export function fetchGamesList() {
    checkFunctionIsCalledOnce('setGamesList');
    assertLoggedIn();
    // TODO: implement.
    getRef('TODO').once('value', gotGamesList);
  }

  // Eventually dispatches the action setMatchesList
  // every time this field is updated:
  //  /gamePortal/gamePortalUsers/$myUserId/privateButAddable/matchMemberships
  export function listenToMyMatchesList() {
    checkFunctionIsCalledOnce('listenToMyMatchesList');
    const user = assertLoggedIn();
    getRef(
      `/gamePortal/gamePortalUsers${
        user.uid
      }/privateButAddable/matchMemberships`
    ).on('value', snap => getMatchMemberships(snap ? snap.val() : {}));
  }

  function getMatchMemberships(matchMemberships: fbr.MatchMemberships) {
    const matchIds = Object.keys(matchMemberships);
    // TODO: get all matches in one call to firebase, then later call dispatch.
    // Make sure we listen to match changes only once.
    // '/gamePortal/matches'
    // dispatch(updateMatchList);
    getRef('/gamePortal/matches' + matchIds); // TODO
  }

  // TODO: make sure we call certain functions only once (checkFunctionIsCalledOnce).

  // TODO: export function updateGameSpec(game: GameInfo) {}

  export function createMatch(game: GameInfo): MatchInfo {
    const user = assertLoggedIn();
    const matchRef = getRef('/gamePortal/matches').push();
    const participants: fbr.Participants = {};
    participants[user.uid] = {
      participantIndex: 0,
      pingOpponents: getTimestamp()
    };
    const newFBMatch: fbr.Match = {
      gameSpecId: game.gameSpecId,
      participants: participants,
      createdOn: getTimestamp(),
      lastUpdatedOn: getTimestamp(),
      pieces: {} // TODO: set initial state correctly based on gameSpec
    };
    // TODO: set matchMemberships
    refSet(matchRef, newFBMatch);
    const newMatch: MatchInfo = {
      matchId: matchRef.key!,
      game: game,
      participantsUserIds: [user.uid],
      lastUpdatedOn: newFBMatch.lastUpdatedOn,
      matchState: {}
    };
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

  export let allPromisesForTests: Promise<any>[] | null = null;

  /////////////////////////////////////////////////////////////////////////////
  // All the non-exported functions (i.e., private functions).
  /////////////////////////////////////////////////////////////////////////////
  function addPromiseForTests(promise: Promise<any>) {
    if (allPromisesForTests) {
      allPromisesForTests.push(promise);
    }
  }

  function refSet(ref: firebase.database.Reference, val: any) {
    addPromiseForTests(ref.set(val, getOnComplete(ref, val)));
  }

  function refUpdate(ref: firebase.database.Reference, val: any) {
    addPromiseForTests(ref.update(val, getOnComplete(ref, val)));
  }

  function getOnComplete(ref: firebase.database.Reference, val: any) {
    return (err: Error | null) => {
      // on complete
      if (err) {
        console.error(
          'Failed writing to ref=',
          ref.toString(),
          ` value=`,
          prettyJson(val)
        );
      }
    };
  }

  function gotGamesList(snap: firebase.database.DataSnapshot) {
    // TODO: create updateGameListAction + reducers etc.
    let updateGameListAction: any = snap.val(); // TODO: change this.
    // TODO2 (after other TODOs are done): handle screenshotImageId
    // firebase.storage().ref('images/blabla.jpg').getDownloadURL()
    dispatch(updateGameListAction);
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

  function getRef(path: string) {
    return firebase.database().ref(path);
  }
}
