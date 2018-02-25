// import { Contact } from '../types/index';
import { store } from '../stores/index';
import * as firebase from 'firebase';

// All interactions with firebase must be in this module.
export module ourFirebase {
  // We're using redux, so all state must be stored in the store.
  // I.e., we can't have any state/variables/etc.

  // Call init exactly once to connect to firebase.
  export function init() {
    // Initialize Firebase
    let config = {
      apiKey: 'AIzaSyDA5tCzxNzykHgaSv1640GanShQze3UK-M',
      authDomain: 'universalgamemaker.firebaseapp.com',
      databaseURL: 'https://universalgamemaker.firebaseio.com',
      projectId: 'universalgamemaker',
      storageBucket: 'universalgamemaker.appspot.com',
      messagingSenderId: '144595629077'
    };
    firebase.initializeApp(config);
  }

  // See https://firebase.google.com/docs/auth/web/phone-auth
  export function signInWithPhoneNumber(
      phoneNumber: string,
      applicationVerifier: firebase.auth.ApplicationVerifier): Promise<any> {
    // TODO: create or update /gamePortal/gamePortalUsers/$myUserId
    // TODO: set recaptcha
    return firebase.auth().signInWithPhoneNumber(phoneNumber, applicationVerifier);
  }

  // In the real app we'll sign in only using phone numbers.
  // Only call signInAnonymously for testing/debugging purposes.
  export function signInAnonymously(): Promise<any> {
    // TODO: create or update /gamePortal/gamePortalUsers/$myUserId
    return firebase.auth().signInAnonymously();
  }

  // Eventually dispatches the action setGamesList.
  export function setGamesList() {
    assertLoggedIn();
    // TODO: implement.
    db().ref('TODO').once('value', gotGamesList);
  }

  // Eventually dispatches the action setMatchesList
  // every time this field is updated:
  //  /gamePortal/gamePortalUsers/$myUserId/privateButAddable/matchMemberships
  export function listenToMyMatchesList() {
    // TODO: implement
  }

  // TODO: export function updateGameSpec(game: GameInfo) {}

  // Eventually dispatches updateMatchIdToMatchState, and it will dispatch
  // it again every time the match is updated
  // (e.g. a participant was added or the state of pieces changed).
  // TODO: export function listenForMatchUpdates(match: MatchInfo) {}

  // TODO: export function createMatch(game: GameInfo): MatchInfo {}
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
  
  function assertLoggedIn() {
    if (!currentUser()) {
      throw new Error('You must be logged in');
    }
  }

  function currentUser() {
    return firebase.auth().currentUser;
  }

  function db() {
    return firebase.database();
  } 
}