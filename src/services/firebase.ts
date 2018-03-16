import { store, dispatch } from '../stores';
import * as firebase from 'firebase';
import {
  checkCondition,
  getValues,
  prettyJson,
  objectMap,
  checkNotNull
} from '../globals';
import {
  BooleanIndexer,
  MatchInfo,
  GameInfo,
  MatchState,
  IdIndexer,
  UserIdsAndPhoneNumbers,
  SignalEntry,
  PhoneNumberToContact,
  Image,
  Element,
  ImageIdToImage,
  ElementIdToElement,
  GameSpec,
  Piece,
  GameSpecIdToGameSpec,
  GameSpecs,
  PieceState
} from '../types';
import { Action } from '../reducers';

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
    checkFunctionIsCalledOnce('init');
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
    checkCondition('countryCode', countryCode.length === 2);
    myCountryCode = countryCode;
    // Eventually call writeUser.
    // TODO: set recaptcha
    return firebase
      .auth()
      .signInWithPhoneNumber(phoneNumber, applicationVerifier);
  }

  function getTimestamp(): number {
    return <number>firebase.database.ServerValue.TIMESTAMP;
  }

  export function writeUser(overridePhoneNumberForTest: string = '') {
    checkFunctionIsCalledOnce('writeUser');
    const user = assertLoggedIn();
    const phoneNumber = user.phoneNumber
      ? user.phoneNumber
      : overridePhoneNumberForTest;
    const userFbr: fbr.PrivateFields = {
      createdOn: getTimestamp(), // It's actually "last logged in on timestamp"
      fcmTokens: {},
      contacts: {},
      phoneNumber: phoneNumber,
      countryCode: myCountryCode
    };
    // I don't want to update these.
    delete userFbr.fcmTokens;
    delete userFbr.contacts;
    refUpdate(
      getRef(`/gamePortal/gamePortalUsers/${user.uid}/privateFields`),
      userFbr
    );

    const phoneNumberFbr: fbr.PhoneNumber = {
      userId: user.uid,
      timestamp: getTimestamp()
    };
    if (phoneNumber) {
      checkPhoneNum(phoneNumber);
      refSet(
        getRef(`/gamePortal/phoneNumberToUserId/${phoneNumber}`),
        phoneNumberFbr
      );
    }

    dispatch({
      setMyUser: {
        myUserId: user.uid,
        myCountryCode: myCountryCode,
        myPhoneNumber: phoneNumber
      }
    });
    // I can only listen to matches after I got the match list (because I convert gameSpecId to gameInfo).
    fetchGamesList().then(() => {
      listenToMyMatchesList();
      listenToSignals();
    });
  }

  // Since our test use anonymous login
  // and the rules only allow you to write there if you have auth.token.phone_number
  // we can not add in gamePortal/PhoneNumberToUserId/${phoneNumber}
  // So firebase rules add "123456789" for test
  export const magicPhoneNumberForTest = '123456789';

  export function checkPhoneNum(phoneNum: string) {
    const isValidNum =
      /^[+][0-9]{5,20}$/.test(phoneNum) || phoneNum === magicPhoneNumberForTest;
    checkCondition('phone num', isValidNum);
  }

  // Eventually dispatches the action setGamesList.
  function fetchGamesList() {
    assertLoggedIn();
    return getRef('/gamePortal/gamesInfoAndSpec/gameInfos').once(
      'value',
      snapshot => {
        const gameInfos: fbr.GameInfos = snapshot.val();
        if (!gameInfos) {
          throw new Error('no games!');
        }
        const gameList: GameInfo[] = getValues(gameInfos).map(gameInfoFbr => {
          const screenShotImage = gameInfoFbr.screenShotImage;
          const gameInfo: GameInfo = {
            gameSpecId: gameInfoFbr.gameSpecId,
            gameName: gameInfoFbr.gameName,
            screenShot: convertImage(
              gameInfoFbr.screenShotImageId,
              screenShotImage
            )
          };
          return gameInfo;
        });
        dispatch({ setGamesList: gameList });
      }
    );
  }

  // Eventually dispatches the action updateGameSpecs.
  export function fetchGameSpec(game: GameInfo) {
    const gameSpecId = game.gameSpecId;
    assertLoggedIn();
    getRef(
      `/gamePortal/gamesInfoAndSpec/gameSpecsForPortal/${gameSpecId}`
    ).once('value', snapshot => {
      const gameSpecF: fbr.GameSpecForPortal = snapshot.val();
      if (!gameSpecF) {
        throw new Error('no game spec!');
      }
      const action: Action = {
        updateGameSpecs: convertGameSpecForPortal(gameSpecId, gameSpecF)
      };
      dispatch(action);
    });
  }

  function convertGameSpecForPortal(
    gameSpecId: string,
    gameSpecF: fbr.GameSpecForPortal
  ): GameSpecs {
    const { images, elements, gameSpec } = gameSpecF;
    const imageIdToImage: ImageIdToImage = objectMap(
      images,
      (img: fbr.Image, imageId: string) => convertImage(imageId, img)
    );
    let elementIdToElement: ElementIdToElement = objectMap(
      elements,
      (element: fbr.Element, elementId: string) =>
        convertElement(elementId, element, imageIdToImage)
    );

    const gameSpecIdToGameSpec: GameSpecIdToGameSpec = {
      [gameSpecId]: convertGameSpec(
        gameSpec,
        imageIdToImage,
        elementIdToElement
      )
    };
    return {
      imageIdToImage: imageIdToImage,
      elementIdToElement: elementIdToElement,
      gameSpecIdToGameSpec: gameSpecIdToGameSpec
    };
  }
  function convertObjectToArray<T>(obj: IdIndexer<T>): T[] {
    let vals: T[] = [];
    let count = 0;
    for (let key of Object.keys(obj)) {
      checkCondition('index is int', /^(0|[1-9]\d*)$/.test(key));
      checkCondition('no duplicate index', !(key in vals));
      vals[key] = obj[key];
      count++;
    }
    checkCondition('no missing index', count === vals.length);
    return vals;
  }
  function convertImage(imageId: string, img: fbr.Image): Image {
    checkCondition('compressed', img.cloudStoragePath.startsWith('compressed'));
    return {
      imageId: imageId,
      height: img.height,
      width: img.width,
      isBoardImage: img.isBoardImage,
      downloadURL: img.downloadURL
    };
  }
  function convertElement(
    elementId: string,
    element: fbr.Element,
    imgs: ImageIdToImage
  ): Element {
    return {
      elementId: elementId,
      height: element.height,
      width: element.width,
      elementKind: element.elementKind,
      images: convertObjectToArray(element.images).map(elementImage =>
        checkNotNull(imgs[elementImage.imageId])
      ),
      isDraggable: element.isDraggable
    };
  }
  function convertPiece(piece: fbr.Piece, elements: ElementIdToElement): Piece {
    return {
      deckPieceIndex: piece.deckPieceIndex,
      element: checkNotNull(elements[piece.pieceElementId]),
      initialState: piece.initialState
    };
  }
  function convertGameSpec(
    gameSpec: fbr.GameSpec,
    imgs: ImageIdToImage,
    elements: ElementIdToElement
  ): GameSpec {
    return {
      board: checkNotNull(imgs[gameSpec.board.imageId]),
      pieces: convertObjectToArray(gameSpec.pieces).map(piece =>
        convertPiece(piece, elements)
      )
    };
  }

  // Eventually dispatches the action setMatchesList
  // every time this field is updated:
  //  /gamePortal/gamePortalUsers/$myUserId/privateButAddable/matchMemberships
  function listenToMyMatchesList() {
    getMatchMembershipsRef().on('value', snap => {
      getMatchMemberships(snap ? snap.val() : {});
    });
  }

  function getMatchMembershipsRef(userId?: string) {
    const uid = userId ? userId : getUserId();
    return getRef(
      `/gamePortal/gamePortalUsers/${uid}/privateButAddable/matchMemberships`
    );
  }

  const listeningToMatchIds: string[] = [];
  const receivedMatches: IdIndexer<MatchInfo> = {};

  function getMatchMemberships(matchMemberships: fbr.MatchMemberships) {
    if (!matchMemberships) {
      return;
    }
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
      const newMatchStates = convertPiecesStateToMatchState(matchFb.pieces);
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

  export function createMatch(
    game: GameInfo,
    initialState: MatchState
  ): MatchInfo {
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
      pieces: convertMatchStateToPiecesState(initialState)
    };
    refSet(matchRef, newFBMatch);
    addMatchMembership(uid, matchId);

    const newMatch: MatchInfo = {
      matchId: matchId,
      game: game,
      participantsUserIds: [uid],
      lastUpdatedOn: newFBMatch.lastUpdatedOn,
      matchState: initialState
    };
    return newMatch;
  }

  function addMatchMembership(toUserId: string, matchId: string) {
    const matchMembership: fbr.MatchMembership = {
      addedByUid: getUserId(),
      timestamp: getTimestamp()
    };
    const matchMemberships: fbr.MatchMemberships = {
      [matchId]: matchMembership
    };
    refUpdate(getMatchMembershipsRef(toUserId), matchMemberships);
  }

  const MAX_USERS_IN_MATCH = 8;
  export function addParticipant(match: MatchInfo, userId: string) {
    checkCondition(
      'addParticipant',
      match.participantsUserIds.indexOf(userId) === -1
    );
    checkCondition(
      'MAX_USERS_IN_MATCH',
      match.participantsUserIds.length < MAX_USERS_IN_MATCH
    );
    const matchId = match.matchId;
    const participantNumber = match.participantsUserIds.length;
    const participantUserObj: fbr.ParticipantUser = {
      participantIndex: participantNumber,
      pingOpponents: getTimestamp()
    };
    refSet(
      getRef(`/gamePortal/matches/${matchId}/participants/${userId}`),
      participantUserObj
    );
    addMatchMembership(userId, matchId);
  }

  // Call this after resetting a match or shuffling a deck.
  export function updateMatchState(match: MatchInfo, matchState: MatchState) {
    checkCondition('updateMatchState', matchState.length > 0);
    const updates: any = {};
    updates['pieces'] = convertMatchStateToPiecesState(matchState);
    updates['lastUpdatedOn'] = getTimestamp();
    refUpdate(getRef(`/gamePortal/matches/${match.matchId}`), updates);
  }

  // Call this after updating a single piece.
  export function updatePieceState(
    match: MatchInfo,
    pieceIndex: number,
    pieceState: PieceState
  ) {
    const updates: any = {};
    updates[`pieces/${pieceIndex}`] = convertPieceState(pieceState);
    updates['lastUpdatedOn'] = getTimestamp();
    refUpdate(getRef(`/gamePortal/matches/${match.matchId}`), updates);
  }

  function convertPiecesStateToMatchState(
    piecesState: fbr.PiecesState
  ): MatchState {
    if (!piecesState) {
      return [];
    }
    const newMatchStates: MatchState = convertObjectToArray(piecesState).map(
      state => state.currentState
    );
    return newMatchStates;
  }

  function convertPieceState(pieceState: PieceState): fbr.PieceState {
    return {
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
  function convertMatchStateToPiecesState(
    matchState: MatchState
  ): fbr.PiecesState {
    const piecesState: fbr.PiecesState = {};
    let pieceIndex = 0;
    for (let pieceState of matchState) {
      piecesState[pieceIndex] = convertPieceState(pieceState);
      pieceIndex++;
    }
    return piecesState;
  }

  export function pingOpponentsInMatch(match: MatchInfo) {
    const userId = getUserId();
    const matchId = match.matchId;
    refSet(
      getRef(
        `/gamePortal/matches/${matchId}/participants/${userId}/pingOpponents`
      ),
      getTimestamp()
    );
  }

  // Stores my contacts in firebase and eventually dispatches updateUserIdsAndPhoneNumbers.
  export function storeContacts(currentContacts: PhoneNumberToContact) {
    checkFunctionIsCalledOnce('storeContacts');
    const currentPhoneNumbers = Object.keys(currentContacts);
    currentPhoneNumbers.forEach(phoneNumber => checkPhoneNum(phoneNumber));
    // Max contactName is 20 chars
    currentPhoneNumbers.forEach(phoneNumber => {
      const contact = currentContacts[phoneNumber];
      if (contact.name.length > 17) {
        contact.name = contact.name.substr(0, 17) + '…';
      }
      if (contact.name.length === 0) {
        contact.name = 'Unknown name';
      }
    });
    const state = store.getState();

    // Mapping phone number to userId for those numbers that don't have a userId.
    const phoneNumberToUserId =
      state.userIdsAndPhoneNumbers.phoneNumberToUserId;
    const numbersWithoutUserId = currentPhoneNumbers.filter(
      phoneNumber => phoneNumberToUserId[phoneNumber] === undefined
    );
    mapPhoneNumbersToUserIds(numbersWithoutUserId);

    const updates = {};
    const oldContacts = store.getState().phoneNumberToContact;
    currentPhoneNumbers.forEach(phoneNumber => {
      const currentContact = currentContacts[phoneNumber];
      const oldContact = oldContacts[phoneNumber];
      if (!oldContact) {
        updates[`${phoneNumber}`] = { contactName: currentContact.name };
      } else if (currentContact.name !== oldContact.name) {
        updates[`${phoneNumber}/contactName`] = currentContact.name;
      }
    });
    if (Object.keys(updates).length > 0) {
      refUpdate(
        getRef(
          `/gamePortal/gamePortalUsers/${getUserId()}/privateFields/contacts`
        ),
        updates
      );
    }

    dispatch({ updatePhoneNumberToContact: currentContacts });
  }

  function mapPhoneNumbersToUserIds(phoneNumbers: string[]) {
    const userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers = {
      phoneNumberToUserId: {},
      userIdToPhoneNumber: {}
    };
    const promises: Promise<void>[] = [];
    phoneNumbers.forEach((phoneNumber: string) => {
      promises.push(getPhoneNumberDetail(userIdsAndPhoneNumbers, phoneNumber));
    });
    Promise.all(promises).then(() => {
      dispatch({ updateUserIdsAndPhoneNumbers: userIdsAndPhoneNumbers });
    });
  }

  function getPhoneNumberDetail(
    userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers,
    phoneNumber: string
  ): Promise<void> {
    return getRef(`/gamePortal/phoneNumberToUserId/` + phoneNumber)
      .once('value')
      .then(snap => {
        if (!snap) {
          return;
        }
        const phoneNumberFbrObj: fbr.PhoneNumber = snap.val();
        if (!phoneNumberFbrObj) {
          return;
        }
        const userId = phoneNumberFbrObj.userId;
        userIdsAndPhoneNumbers.userIdToPhoneNumber[userId] = phoneNumber;
        userIdsAndPhoneNumbers.phoneNumberToUserId[phoneNumber] = userId;
      });
  }

  // Dispatches setSignals.
  function listenToSignals() {
    const userId = getUserId();
    const ref = getRef(
      `/gamePortal/gamePortalUsers/${userId}/privateButAddable/signals`
    );
    ref.on('value', snap => {
      if (!snap) {
        return;
      }
      const signalsFbr: fbr.Signals = snap.val();
      if (!signalsFbr) {
        return;
      }
      // We start with the old signals and add to them.
      let signals: SignalEntry[] = store.getState().signals;
      let updates: any = {};
      Object.keys(signalsFbr).forEach(entryId => {
        updates[entryId] = null;
        const signalFbr: fbr.SignalEntry = signalsFbr[entryId];
        const signal: SignalEntry = signalFbr;
        signals.push(signal);
      });

      // Deleting the signals we got from firebase.
      refUpdate(ref, updates);

      // filtering old signals.
      const now = new Date().getTime();
      const fiveMinAgo = now - 5 * 60 * 1000;
      signals = signals.filter(signal => fiveMinAgo <= signal.timestamp);

      // Sorting: oldest entries are at the beginning
      signals.sort((signal1, signal2) => signal1.timestamp - signal2.timestamp);

      dispatch({ setSignals: signals });
    });
  }

  export function sendSignal(
    toUserId: string,
    signalType: 'sdp' | 'candidate',
    signalData: string
  ) {
    checkCondition('sendSignal', signalData.length < 10000);
    const userId = getUserId();
    const signalFbr: fbr.SignalEntry = {
      addedByUid: userId,
      timestamp: getTimestamp(),
      signalType: signalType,
      signalData: signalData
    };
    const signalFbrRef = getRef(
      `/gamePortal/gamePortalUsers/${toUserId}/privateButAddable/signals`
    ).push();
    refSet(signalFbrRef, signalFbr);
  }

  export function addFcmToken(fcmToken: string, platform: 'ios' | 'android') {
    checkCondition('addFcmToken', /^.{140,200}$/.test(fcmToken));
    // Can be called multiple times if the token is updated.
    const fcmTokenObj: fbr.FcmToken = {
      lastTimeReceived: <any>firebase.database.ServerValue.TIMESTAMP,
      platform: platform
    };
    refSet(
      getRef(
        `/gamePortal/gamePortalUsers/${getUserId()}/privateFields/fcmTokens/${fcmToken}`
      ),
      fcmTokenObj
    );
  }

  export let allPromisesForTests: Promise<any>[] | null = null;

  function addPromiseForTests(promise: Promise<any>) {
    if (allPromisesForTests) {
      allPromisesForTests.push(promise);
    }
  }

  function refSet(ref: firebase.database.Reference, val: any) {
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

  function assertLoggedIn(): firebase.User {
    const user = currentUser();
    if (!user) {
      throw new Error('You must be logged in');
    }
    return user;
  }

  export function getUserId() {
    return assertLoggedIn().uid;
  }

  function currentUser() {
    return firebase.auth().currentUser;
  }

  function getRef(path: string) {
    return firebase.database().ref(path);
  }
}
