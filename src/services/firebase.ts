// import { Contact } from '../types/index';
import { store, dispatch } from '../stores';
import * as firebase from 'firebase';
import { checkCondition, getValues } from '../globals';
import { Action } from '../reducers';
import {
  BooleanIndexer,
  MatchInfo,
  GameInfo,
  MatchState,
  PieceState,
  IdIndexer
} from '../types';

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
    getMatchMembershipsRef().on('value', snap => {
      getMatchMemberships(snap ? snap.val() : {});
    });
  }

  function getMatchMembershipsRef() {
    return getRef(
      `/gamePortal/gamePortalUsers/${getUserId()}/privateButAddable/matchMemberships`
    );
  }

  const listeningToMatchIds: string[] = [];
  const receivedMatches: IdIndexer<MatchInfo> = {};

  function getMatchMemberships(matchMemberships: fbr.MatchMemberships) {
    const matchIds = Object.keys(matchMemberships);
    const newMatchIds: string[] = matchIds.filter(
      matchId => listeningToMatchIds.indexOf(matchId) === -1
    );
    for (let matchId of newMatchIds) {
      listenToMatch(matchId);
    }
  }

  function listenToMatch(matchId: string) {
    checkCondition(
      'listeningToMatchIds',
      listeningToMatchIds.indexOf(matchId) === -1
    );
    listeningToMatchIds.push(matchId);
    // let matchInfo = {};
    return getRef('/gamePortal/matches/' + matchId).on('value', snap => {
      if (!snap) {
        return;
      }
      const matchFb: fbr.Match = snap.val();
      if (!matchFb) {
        return;
      }
      const gameSpecId = matchFb.gameSpecId;
      const game: GameInfo | undefined = store
        .getState()
        .gamesList.find(gameInList => gameInList.gameSpecId === gameSpecId);
      checkCondition('missing gameSpecId for match', game);
      const newMatchStates: MatchState = {};
      const tempPieces = matchFb.pieces ? matchFb.pieces : {};
      Object.keys(tempPieces).forEach(tempPieceKey => {
        let newMatchState: PieceState;
        newMatchState = {
          x: tempPieces[tempPieceKey].currentState.x,
          y: tempPieces[tempPieceKey].currentState.y,
          zDepth: tempPieces[tempPieceKey].currentState.zDepth,
          cardVisibility: tempPieces[tempPieceKey].currentState.cardVisibility,
          currentImageIndex:
            tempPieces[tempPieceKey].currentState.currentImageIndex
        };
        newMatchStates[tempPieceKey] = newMatchState;
      });
      const participants = matchFb.participants;
      // Sort by participant's index (ascending participantIndex order)
      const participantsUserIds = Object.keys(participants).sort(
        (uid1, uid2) =>
          participants[uid1].participantIndex -
          participants[uid2].participantIndex
      );

      const match: MatchInfo = {
        matchId: matchId,
        game: game!,
        participantsUserIds: participantsUserIds,
        lastUpdatedOn: matchFb.lastUpdatedOn,
        matchState: newMatchStates
      };
      receivedMatches[matchId] = match;
      const matches = getValues(receivedMatches);
      if (matches.length === listeningToMatchIds.length) {
        // We got all the matches.
        // Sort by lastUpdatedOn (descending lastUpdatedOn order).
        matches.sort((a, b) => b.lastUpdatedOn - a.lastUpdatedOn);
        dispatch({ setMatchesList: matches });
      }
    });
  }

  // TODO: make sure we call certain functions only once (checkFunctionIsCalledOnce).

  // TODO: export function updateGameSpec(game: GameInfo) {}

  export function createMatch(game: GameInfo): MatchInfo {
    const uid = getUserId();
    const matchRef = getRef('/gamePortal/matches').push();
    const matchId = matchRef.key!;
    const participants: fbr.Participants = {};
    participants[uid] = {
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
    refSet(matchRef, newFBMatch);

    const matchMembership: fbr.MatchMembership = {
      addedByUid: uid,
      timestamp: getTimestamp()
    };
    const matchMemberships: fbr.MatchMemberships = {
      [matchId]: matchMembership
    };
    refUpdate(getMatchMembershipsRef(), matchMemberships);

    const newMatch: MatchInfo = {
      matchId: matchId,
      game: game,
      participantsUserIds: [uid],
      lastUpdatedOn: newFBMatch.lastUpdatedOn,
      matchState: {}
    };
    return newMatch;
  }

  // TODO: export function addParticipant(match: MatchInfo, user: User) {}

  export function updateMatchState(match: MatchInfo, matchState: MatchState) {
    const piecesState: fbr.PiecesState = {};
    for (let pieceIndex of Object.keys(matchState)) {
      const pieceState = matchState[pieceIndex];
      piecesState[pieceIndex] = {
        currentState: {
          x: pieceState.x,
          y: pieceState.y,
          zDepth: pieceState.zDepth,
          currentImageIndex: pieceState.currentImageIndex,
          cardVisibility: pieceState.cardVisibility,
          rotationDegrees: 360,
          drawing: {}
        }
      };
    }

    refUpdate(
      getRef(`/gamePortal/matches/${match.matchId}/pieces`),
      piecesState
    );
  }

  // TODO: export function pingOpponentsInMatch(match: MatchInfo) {}

  // Dispatches updateUserIdsAndPhoneNumbers (reading from /gamePortal/phoneNumberToUserId)
  // TODO: export function updateUserIdsAndPhoneNumbers(phoneNumbers: string[]) {}

  export function addFcmToken(fcmToken: string, platform: 'ios' | 'android') {
    // Can be called multiple times if the token is updated.  checkFunctionIsCalledOnce('addFcmToken');
    const fcmTokenObj: fbr.FcmToken = {
      lastTimeReceived: <any>firebase.database.ServerValue.TIMESTAMP,
      platform: platform
    };
    return refSet(
      getRef(
        `/gamePortal/gamePortalUsers/${getUserId()}/privateFields/fcmTokens/${fcmToken}`
      ),
      fcmTokenObj
    );
  }

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

  export function refSet(ref: firebase.database.Reference, val: any) {
    addPromiseForTests(ref.set(val, getOnComplete(ref, val)));
  }

  function refUpdate(ref: firebase.database.Reference, val: any) {
    // console.log('refUpdate', ref.toString(), " val=", prettyJson(val));
    addPromiseForTests(ref.update(val, getOnComplete(ref, val)));
  }

  function getOnComplete(ref: firebase.database.Reference, val: any) {
    return (err: Error | null) => {
      // on complete
      if (err) {
        let msg =
          'Failed writing to ref=' +
          ref.toString() +
          ` value=` +
          prettyJson(val);
        console.error(msg);
        throw new Error(msg);
      }
    };
  }

  function gotGamesList(snap: firebase.database.DataSnapshot) {
    // TODO: create updateGameListAction + reducers etc.
    let updateGameListAction: Action = snap.val(); // TODO: change this.
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

  function getUserId() {
    return assertLoggedIn().uid;
  }

  function currentUser() {
    return firebase.auth().currentUser;
  }

  function getRef(path: string) {
    return firebase.database().ref(path);
  }
}
