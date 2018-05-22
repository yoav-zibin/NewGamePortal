import { store, dispatch, persistedOldStore } from '../stores';

import * as firebase from 'firebase/app';
// include services that you want
import 'firebase/auth';
import 'firebase/database';

import * as Raven from 'raven-js';
import {
  checkCondition,
  getValues,
  prettyJson,
  objectMap,
  checkNotNull,
  isTests,
  UNKNOWN_NAME,
  getPhoneNumberToUserInfo,
  shallowCopy,
  deepFreeze,
  deepCopy,
  checkPhoneNumber,
  isApp
} from '../globals';
import {
  BooleanIndexer,
  MatchInfo,
  GameInfo,
  MatchState,
  IdIndexer,
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
  PieceState,
  AnyIndexer,
  CardVisibility,
  ContactWithUserId,
  UserIdToInfo,
  NumberIndexer,
  Contact
} from '../types';
import { Action, checkMatchStateInStore } from '../reducers';

// All interactions with firebase must be in this module.
export namespace ourFirebase {
  // We're using redux, so all state must be stored in the store.
  // I.e., we can't have any state/variables/etc that is used externally.
  let calledFunctions: BooleanIndexer = {};
  function checkFunctionIsCalledOnce(functionName: string) {
    console.log('Calling ', functionName);
    checkCondition('checkFunctionIsCalledOnce', !calledFunctions[functionName]);
    calledFunctions[functionName] = true;
  }

  // Stores my contacts in firebase and eventually dispatches updateUserIdToInfo.
  // storeContacts can be called even before the login finished.
  let contactsToBeStored: PhoneNumberToContact | null = null;
  export function storeContacts(currentContacts: PhoneNumberToContact) {
    checkFunctionIsCalledOnce('storeContacts');
    contactsToBeStored = currentContacts;
    if (currentUser()) {
      storeContactsAfterLogin();
    }
  }

  interface FcmToken {
    fcmToken: string;
    platform: 'web' | 'ios' | 'android';
  }
  let fcmTokensToBeStored: FcmToken[] = [];

  export function addFcmToken(fcmToken: string, platform: 'web' | 'ios' | 'android') {
    // Can be called multiple times if the token is updated.
    checkCondition('addFcmToken', /^.{10,200}$/.test(fcmToken));
    fcmTokensToBeStored.push({ fcmToken, platform });
    if (currentUser()) {
      storeFcmTokensAfterLogin();
    }
  }

  export let reactRender = () => {
    /*no op*/
  };

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
    if (!persistedOldStore) {
      reactRender();
    }

    firebase.auth().onAuthStateChanged(user => {
      console.log('onAuthStateChanged: hasUser=', !!user);
      if (user) {
        postLogin();
        if (contactsToBeStored) {
          storeContactsAfterLogin();
        }
        storeFcmTokensAfterLogin();
        reactRender();
      }
    });
  }

  // See https://firebase.google.com/docs/auth/web/phone-auth
  let myCountryCodeForSignInWithPhoneNumber = '';
  let displayNameForSignIn = '';
  export function signInWithPhoneNumber(
    phoneNumber: string,
    countryCode: string,
    displayName: string
  ): Promise<any> {
    checkFunctionIsCalledOnce('signInWithPhoneNumber');
    checkCondition('countryCode', countryCode.length === 2);
    // TODO: choose language based on country (once we i18n)
    // e.g. http://download.geonames.org/export/dump/countryInfo.txt
    firebase.auth().languageCode = 'en';
    const applicationVerifier: firebase.auth.ApplicationVerifier = new firebase.auth.RecaptchaVerifier(
      'recaptcha-container',
      {
        size: 'invisible'
      }
    );
    myCountryCodeForSignInWithPhoneNumber = countryCode;
    displayNameForSignIn = displayName;
    return firebase.auth().signInWithPhoneNumber(phoneNumber, applicationVerifier);
  }

  function getTimestamp(): number {
    return <number>firebase.database.ServerValue.TIMESTAMP;
  }

  let phoneNumberForSignInAnonymously: string = '';
  let resolveAfterLoginForTests: (() => void) | null = null;
  export let allPromisesForTests: Promise<any>[] | null = null;
  export function signInAnonymously(phoneNumberForTest: string, displayName: string) {
    phoneNumberForSignInAnonymously = phoneNumberForTest;
    displayNameForSignIn = displayName;
    addPromiseForTests(firebase.auth().signInAnonymously());
    if (allPromisesForTests) {
      allPromisesForTests.push(
        new Promise(resolve => {
          console.log('Setting resolveAfterLoginForTests');
          resolveAfterLoginForTests = resolve;
        })
      );
    }
  }

  // Function is called after the user is logged in, which can happen either
  // after the login screen (calling signIn* method) or because of cookies.
  function postLogin() {
    checkFunctionIsCalledOnce('postLogin');
    const user = assertLoggedIn();
    const uid = user.uid;
    if (persistedOldStore && uid === persistedOldStore.myUser.myUserId) {
      dispatch({ restoreOldStore: persistedOldStore });
      if (!myCountryCodeForSignInWithPhoneNumber) {
        myCountryCodeForSignInWithPhoneNumber = persistedOldStore.myUser.myCountryCode;
      }
      if (!displayNameForSignIn) {
        displayNameForSignIn = persistedOldStore.myUser.myName;
      }
      if (Object.keys(persistedOldStore.phoneNumberToContact).length > 0) {
        // Refresh contacts (but with a bit of delay because it's computationally heavy)
        setTimeout(fetchContacts, 1000);
      }
    }
    if (!displayNameForSignIn) {
      displayNameForSignIn = '';
    }
    if (phoneNumberForSignInAnonymously) {
      user.updateProfile({
        displayName: 'Anonymous Test user',
        photoURL: null
      });
    }
    const phoneNumber = user.phoneNumber ? user.phoneNumber : phoneNumberForSignInAnonymously;

    Raven.setUserContext({
      name: displayNameForSignIn,
      phoneNumber: phoneNumber,
      countryCode: myCountryCodeForSignInWithPhoneNumber,
      userId: uid
    });

    updatePrivateFieldsAfterLogin(uid, phoneNumber);
    dispatch({
      setMyUser: {
        myName: displayNameForSignIn,
        myUserId: uid,
        myCountryCode: myCountryCodeForSignInWithPhoneNumber,
        myPhoneNumber: phoneNumber
      }
    });
    // I can only listen to matches after I got the games list (because I convert gameSpecId to gameInfo).
    const canListToMatches = store.getState().gamesList.length > 0;
    if (canListToMatches) {
      listenToMyMatchesList();
    }
    fetchGamesList().then(() => {
      if (!canListToMatches) {
        listenToMyMatchesList();
      }
    });
    listenToSignals();
    if (resolveAfterLoginForTests) {
      resolveAfterLoginForTests();
    }
  }

  function updatePrivateFieldsAfterLogin(uid: string, phoneNumber: string) {
    const updates: AnyIndexer = {};
    updates['privateFields/createdOn'] = getTimestamp(); // It's actually "last logged in on timestamp"
    updates['privateFields/phoneNumber'] = phoneNumber;
    updates['privateFields/countryCode'] = myCountryCodeForSignInWithPhoneNumber;
    updates['publicFields/displayName'] = displayNameForSignIn;
    refUpdate(getRef(`/gamePortal/gamePortalUsers/${uid}`), updates);

    const phoneNumberFbr: fbr.PhoneNumber = {
      userId: uid,
      timestamp: getTimestamp()
    };
    if (phoneNumber) {
      checkPhoneNumIsValid(phoneNumber);
      refSet(getRef(`/gamePortal/phoneNumberToUserId/${phoneNumber}`), phoneNumberFbr);
    }
  }

  function checkPhoneNumIsValid(phoneNum: string) {
    const isValidNum = /^[+][0-9]{5,20}$/.test(phoneNum);
    checkCondition('phone num', isValidNum);
  }

  // Eventually dispatches the action setGamesList.
  function fetchGamesList() {
    assertLoggedIn();
    return getOnce('/gamePortal/gamesInfoAndSpec/gameInfos').then((gameInfos: fbr.GameInfos) => {
      if (!gameInfos) {
        throw new Error('no games!');
      }
      const gameList: GameInfo[] = convertObjectToArray(gameInfos).map(gameInfoFbr => {
        const screenShotImage = gameInfoFbr.screenShotImage;
        const gameInfo: GameInfo = {
          gameSpecId: gameInfoFbr.gameSpecId,
          gameName: gameInfoFbr.gameName,
          screenShot: convertImage(gameInfoFbr.screenShotImageId, screenShotImage),
          wikipediaUrl: gameInfoFbr.wikipediaUrl || ''
        };
        return gameInfo;
      });
      dispatch({ setGamesList: gameList });
    });
  }

  // Eventually dispatches the action updateGameSpecs.
  const isFetchingGameSpec: BooleanIndexer = {};
  export function fetchGameSpec(game: GameInfo) {
    const gameSpecId = game.gameSpecId;
    assertLoggedIn();
    if (store.getState().gameSpecs.gameSpecIdToGameSpec[gameSpecId]) {
      return;
    }
    if (isFetchingGameSpec[gameSpecId]) {
      return;
    }
    if (!isTests) {
      console.log('fetchGameSpec:', gameSpecId);
    }
    isFetchingGameSpec[gameSpecId] = true;
    getOnce(`/gamePortal/gamesInfoAndSpec/gameSpecsForPortal/${gameSpecId}`).then(
      (gameSpecF: fbr.GameSpecForPortal) => {
        if (!isTests) {
          console.log('Got game spec for:', game);
        }
        if (!gameSpecF) {
          throw new Error('no game spec!');
        }
        const action: Action = {
          updateGameSpecs: fixGameSpecs(convertGameSpecForPortal(gameSpecId, gameSpecF))
        };
        dispatch(action);
      }
    );
  }

  function fixGameSpecs(gameSpecs: GameSpecs): GameSpecs {
    const elementIdToResizingFactor: NumberIndexer = {
      // Aeroplane Chess gameSpecId: "-KzIu__PqVGdQhAlileQ"
      '-KzItgbiXd89CURCoXe5': 1.5, // increase that element ID by 20%
      '-KzItocCLqCMbFLpFDzb': 1.5,
      '-KzItsMbQZMzCjk8rKSP': 1.5,
      '-KzItkd4gsI3JZlsaZUZ': 1.5,
      // Snakes and Ladders gameSpecId: "-KzKeLTztuc88-oLtUjZ"
      '-KxLHdaHqRj2RTr-f_9z': 1.5,
      '-KxLHdaHqRj2RTr-f_9y': 1.5,
      '-KxLHdaHqRj2RTr-f_9w': 1.5,
      '-KxLHdaHqRj2RTr-f_9x': 1.5,
      // wuziqi gameSpecId: "-KzKeLTztuc88-oLtUjZ"
      '-L-D32t8tptFtTuCD5zQ': 1.5,
      '-L-D31CjnDuFP43sWNGG': 1.5,
      // Clue gameSpecId: '-L-db4M-NKnZlguWs7xv', resize board pieces, not cards
      '-L-dSYpgkkP8VkSTZ7KK': 2,
      '-L-dSTNc7aivSSEG8dBP': 2,
      '-L-dSd-o1P94VK-Cvldy': 2,
      '-L-dSA7CMYdk3RFhJc0_': 2,
      '-L-dSf-GqwOBRnu8Ml4K': 2,
      '-L-dSb65g1V0aacou5wy': 2
    };
    // For the listed game specs, all their elements should be hidden at start of game
    const switchCardImages = [
      '-KxLz3GDxUi9QADh3jN0', // Simply Ingenious
      '-L-db4M-NKnZlguWs7xv', // Clue
      '-L01xDqdP8hN1PCJuwI8', // Texas Hold 'em
      '-L01xupWIg2jOCp9Sh_K', // Crazy Eights
      '-L0DEfpWO-G2hX3Wcp8-', // Spades
      '-L0r6qHkR2fkeCk6B7zB', // Bananagrams
      '-L-7byJiaazYQ5V5i2hW', // Sevens
      '-L-8rUonEDrh-IkJk9nk', // Dou dizhu
      '-L-9-GuzOZJ6sRAVCh6b', // Five Card Stud
      '-L-9qTVLsumaP9TBL9_O', // diaoyu (changed name: Go Fish)
      '-L-lw5cA3nHJlK8Lc5V9', // Dueling Nobles
      '-L-mhJby9spVzuJTrwti', // Dominion
      '-L-Dz-grEYa6LrM6Bnuz' // Contract bridge
    ];
    for (let gameSpecId of switchCardImages) {
      const spec = gameSpecs.gameSpecIdToGameSpec[gameSpecId];
      if (spec) {
        console.log('Changing images for', gameSpecId);
        for (let piece of spec.pieces) {
          const images = piece.element.images;
          if (images.length < 2) {
            continue;
          }
          const temp = images[0];
          images[0] = images[1];
          images[1] = temp;
        }
      }
    }

    for (let [elementId, element] of Object.entries(gameSpecs.elementIdToElement)) {
      let resizingFactor = elementIdToResizingFactor[elementId];
      if (resizingFactor) {
        element.height *= resizingFactor;
        element.width *= resizingFactor;
      }
      // All standard elements should be draggable.
      if (element.elementKind === 'standard') {
        element.isDraggable = true;
      }
    }

    // Verify all cards have a deck.

    for (let [_gameSpecId, gameSpec] of Object.entries(gameSpecs.gameSpecIdToGameSpec)) {
      let newPieces: Piece[] = [];
      let haveCopiedRedPieceForNewBoku = false;
      let haveCopiedBlackPieceForNewBoku = false;
      let haveCopiedWhitePieceForWuziqi = false;
      let haveCopiedBlackPieceForWuziqi = false;
      for (let piece of gameSpec.pieces) {
        // console.log('32dice show', _gameSpecId);
        const isCard = gameSpecs.elementIdToElement[piece.element.elementId].elementKind === 'card';
        checkCondition('cards', (piece.deckPieceIndex !== -1) === isCard);
        // for -KxLz3CaPRPIBc-0mRP7, Chess, make elementKind to be "standard for all of them"
        if (_gameSpecId === '-KxLz3CaPRPIBc-0mRP7') {
          if (piece.element.elementId === '-KxLHdYYTHiX9HtmGdhj') {
            let newPiece = deepCopy(piece);
            newPiece.initialState.x = 28;
            newPiece.initialState.y = 7.3;
            newPieces!.push(newPiece);
          } else if (piece.element.elementId === '-KxLHdYX937bfhOU04NP') {
            piece.initialState.x = 48.8;
            piece.initialState.y = 7.3;
          } else if (piece.element.elementId === '-KxLHdYLpBVqGTr6C9-C') {
            piece.initialState.x = 38;
            piece.initialState.y = 7.3;
          }
          if (piece.element.elementKind.endsWith('Deck')) {
            // ignore piece;
          } else if (piece.element.elementKind !== 'standard') {
            piece.element.elementKind = 'standard';
          }
        } else if (_gameSpecId === '-L-db4M-NKnZlguWs7xv') {
          console.log(piece.element.elementKind);
          if (piece.element.elementKind === 'cardsDeck') {
            let index = gameSpec.pieces.indexOf(piece);
            if (index === 0) {
              piece.initialState.x = 90;
              piece.initialState.y = 10;
            } else if (index === 29) {
              piece.initialState.x = 90;
              piece.initialState.y = 30;
            } else {
              piece.initialState.x = 90;
              piece.initialState.y = 50;
            }
          } else if (piece.element.elementKind === 'dice') {
            piece.initialState.x = 90;
            piece.initialState.y = 70;
          } else if (piece.element.elementKind === 'standard') {
            if (piece.element.elementId === '-L-dSf-GqwOBRnu8Ml4K') {
              piece.initialState.x = 81.89;
              piece.initialState.y = 60;
            }
          }
        }

        // for -KxLz3FKTdapLIInm8GT, New Boku, make more pieces"
        if (_gameSpecId === '-KxLz3FKTdapLIInm8GT') {
          if (
            piece.element.elementId === '-KxLHdZEbxmx1JxNADd_' &&
            !haveCopiedBlackPieceForNewBoku
          ) {
            for (let i = 0; i < 24; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
            haveCopiedBlackPieceForNewBoku = true;
          } else if (
            piece.element.elementId === '-KxLHdZFYwCkxuYejHug' &&
            !haveCopiedRedPieceForNewBoku
          ) {
            for (let i = 0; i < 24; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
            haveCopiedRedPieceForNewBoku = true;
          }
        }

        // For BlueNile, gameSpecID: -KxLz3Bm_TbQv7Y2MmvM, add more pieces
        if (_gameSpecId === '-KxLz3Bm_TbQv7Y2MmvM') {
          if (piece.element.elementId === '-KxLHdZqRg6fmEBk51N9') {
            for (let i = 0; i < 41; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
          }
        }

        // For three_men_initial, gameSpecID: , add more pieces
        if (_gameSpecId === '-KxLz3Hi15gL3gipt36x') {
          if (piece.element.elementId === '-KxLHdZIHiDchR59OItH') {
            for (let i = 0; i < 2; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
          } else if (piece.element.elementId === '-KxLHdZIHiDchR59OItI') {
            for (let i = 0; i < 2; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
          }
        }

        // For Chaturaji, add another dice
        if (_gameSpecId === '-L0GqDgd4ZlXxT9Zv3-9') {
          if (piece.element.elementKind === 'dice') {
            newPieces!.push(deepCopy(piece));
          }
        }
        // for -L-4HlYZ13tpCgM8M-4H, 32dices, make all of the dices to be draggable
        if (_gameSpecId === '-L-4HlYZ13tpCgM8M-4H' && piece.element.elementKind === 'dice') {
          piece.element.isDraggable = true;
          if (piece.element.elementId === '-L-D31CjnDuFP43sWNGG') {
            // remove redundant dice
            piece.initialState.x = -100;
          }
        }

        // for -L-D3klCiTu3_0yYXDVu, Wuziqi, make more pieces, make them larger"
        if (_gameSpecId === '-L-D3klCiTu3_0yYXDVu') {
          if (
            piece.element.elementId === '-L-D32t8tptFtTuCD5zQ' &&
            !haveCopiedWhitePieceForWuziqi
          ) {
            for (let i = 0; i < 150; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
            haveCopiedWhitePieceForWuziqi = true;
          } else if (
            piece.element.elementId === '-L-D31CjnDuFP43sWNGG' &&
            !haveCopiedBlackPieceForWuziqi
          ) {
            for (let i = 0; i < 150; i++) {
              let newPiece = deepCopy(piece);
              newPieces!.push(newPiece);
            }
            haveCopiedBlackPieceForWuziqi = true;
          }
        }
      }
      if (newPieces!) {
        for (let newPiece of newPieces!) {
          gameSpec.pieces.push(newPiece!);
        }
      }
    }
    return gameSpecs;
  }

  function convertGameSpecForPortal(
    gameSpecId: string,
    gameSpecF: fbr.GameSpecForPortal
  ): GameSpecs {
    const { images, elements, gameSpec } = gameSpecF;
    const imageIdToImage: ImageIdToImage = objectMap(images, (img: fbr.Image, imageId: string) =>
      convertImage(imageId, img)
    );
    let elementIdToElement: ElementIdToElement = objectMap(
      elements,
      (element: fbr.Element, elementId: string) =>
        convertElement(elementId, element, imageIdToImage)
    );

    const gameSpecIdToGameSpec: GameSpecIdToGameSpec = {
      [gameSpecId]: convertGameSpec(gameSpecId, gameSpec, imageIdToImage, elementIdToElement)
    };
    return {
      imageIdToImage: imageIdToImage,
      elementIdToElement: elementIdToElement,
      gameSpecIdToGameSpec: gameSpecIdToGameSpec
    };
  }
  function convertObjectToArray<T>(obj: IdIndexer<T>): T[] {
    let vals: T[] = [];
    if (!obj) {
      // "Fake" decks (created via write-gamesInfoAndSpec.js), have an empty images array.
      return vals;
    }
    let count = 0;
    for (let [key, val] of Object.entries(obj)) {
      checkCondition('index is int', /^(0|[1-9]\d*)$/.test(key));
      checkCondition('no duplicate index', !(key in vals));
      vals[Number(key)] = val;
      count++;
    }
    checkCondition('no missing index', count === vals.length);
    return vals;
  }
  function convertImage(imageId: string, img: fbr.Image): Image {
    // New games have non-compressed images:
    // checkCondition('compressed', img.cloudStoragePath.startsWith('compressed'));
    return {
      imageId: imageId,
      height: img.height,
      width: img.width,
      isBoardImage: img.isBoardImage,
      downloadURL: img.downloadURL
    };
  }
  function convertElement(elementId: string, element: fbr.Element, imgs: ImageIdToImage): Element {
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
      initialState: convertFbrPieceState(piece.initialState)
    };
  }
  function convertGameSpec(
    gameSpecId: string,
    gameSpec: fbr.GameSpec,
    imgs: ImageIdToImage,
    elements: ElementIdToElement
  ): GameSpec {
    return {
      gameSpecId: gameSpecId,
      board: checkNotNull(imgs[gameSpec.board.imageId]),
      pieces: convertObjectToArray(gameSpec.pieces).map(piece => convertPiece(piece, elements))
    };
  }

  // Eventually dispatches the action setMatchesList
  // every time this field is updated:
  //  /gamePortal/gamePortalUsers/$myUserId/privateButAddable/matchMemberships
  function listenToMyMatchesList() {
    checkFunctionIsCalledOnce('listenToMyMatchesList');
    getMatchMembershipsRef().on('value', snap => {
      getMatchMemberships(snap ? snap.val() : {});
    });
  }

  function getMatchMembershipsRef(userId?: string) {
    const uid = userId ? userId : getUserId();
    return getRef(`/gamePortal/gamePortalUsers/${uid}/privateButAddable/matchMemberships`);
  }

  const listeningToMatchIds: string[] = [];
  const receivedMatches: IdIndexer<MatchInfo> = {};
  const ignoredMatches: BooleanIndexer = {};

  function getMatchMemberships(matchMemberships: fbr.MatchMemberships) {
    if (!matchMemberships) {
      dispatchSetMatchesList(); // In case I have deleted all my matches in another device.
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

  function findGameInfo(gameSpecId: string): GameInfo {
    const game: GameInfo | undefined = store
      .getState()
      .gamesList.find(gameInList => gameInList.gameSpecId === gameSpecId);
    if (!game) {
      console.warn('missing gameSpecId for match', game);
    }
    return game!;
  }

  export function listenToMatch(matchId: string) {
    checkCondition('listeningToMatchIds', listeningToMatchIds.indexOf(matchId) === -1);
    listeningToMatchIds.push(matchId);
    return getRef('/gamePortal/matches/' + matchId).on('value', snap => {
      if (!snap) {
        return;
      }
      if (ignoredMatches[matchId]) {
        return;
      }
      const matchFb: fbr.Match = snap.val();
      if (!matchFb) {
        return;
      }
      const uid = getUserId();
      if (receivedMatches[matchId] && receivedMatches[matchId].updatedByUserId === uid) {
        return; // Ignore my own updates
      }
      const gameSpecId = matchFb.gameSpecId;
      const newMatchStates = convertPiecesStateToMatchState(matchFb.pieces, gameSpecId);
      const participants = matchFb.participants;
      // Sort by participant's index (ascending participantIndex order)
      const participantsUserIds = Object.keys(participants).sort(
        (uid1, uid2) => participants[uid1].participantIndex - participants[uid2].participantIndex
      );
      fetchDisplayNameForUserIds(participantsUserIds);

      const gameInfo = findGameInfo(gameSpecId);
      if (!gameInfo) {
        // I've deleted some crappy games, but there are some existing matches.
        ignoredMatches[matchId] = true;
      } else {
        fetchGameSpec(gameInfo);
        const match: MatchInfo = {
          matchId: matchId,
          gameSpecId: gameSpecId,
          game: gameInfo,
          participantsUserIds: participantsUserIds,
          lastUpdatedOn: matchFb.lastUpdatedOn,
          updatedByUserId: matchFb.updatedByUserId || uid,
          matchState: newMatchStates
        };

        receivedMatches[matchId] = match;
      }
      if (
        Object.keys(receivedMatches).length + Object.keys(ignoredMatches).length >=
        listeningToMatchIds.length
      ) {
        dispatchSetMatchesList();
      }
    });
  }

  const fetchedDisplayNameForUserIds: BooleanIndexer = {};
  function fetchDisplayNameForUserId(userId: string) {
    if (fetchedDisplayNameForUserIds[userId]) {
      return;
    }
    fetchedDisplayNameForUserIds[userId] = true;
    getDisplayNameForUserId(userId).then(displayName => {
      addUserInfo(userId, displayName);
    });
  }
  function fetchDisplayNameForUserIds(participantsUserIds: string[]) {
    const uid = assertLoggedIn().uid;
    const state = store.getState();
    const userIdToInfo = state.userIdToInfo;
    participantsUserIds.forEach(userId => {
      if (userId !== uid && !userIdToInfo[userId]) {
        fetchDisplayNameForUserId(userId);
      }
    });
  }

  function dispatchSetMatchesList() {
    const matches = getValues(receivedMatches);
    // Sort by lastUpdatedOn (descending lastUpdatedOn order).
    matches.sort((a, b) => b.lastUpdatedOn - a.lastUpdatedOn);
    dispatch({ setMatchesList: matches });
  }

  export function createMatch(game: GameInfo) {
    if (!isTests) {
      console.log('createMatch for:', game);
    }
    const uid = getUserId();
    const matchRef = getRef('/gamePortal/matches').push();
    const matchId = matchRef.key!;
    const participants: fbr.Participants = {};
    participants[uid] = {
      participantIndex: 0,
      pingOpponents: getTimestamp()
    };

    const gameSpecId = game.gameSpecId;
    fetchGameSpec(game);

    const newFBMatch: fbr.Match = {
      gameSpecId: gameSpecId,
      participants: participants,
      createdOn: getTimestamp(),
      lastUpdatedOn: getTimestamp(),
      updatedByUserId: uid,
      pieces: {}
    };
    refSet(matchRef, newFBMatch);
    addMatchMembership(uid, matchId);

    const newMatch: MatchInfo = {
      matchId: matchId,
      gameSpecId: game.gameSpecId,
      game: game,
      participantsUserIds: [uid],
      lastUpdatedOn: newFBMatch.lastUpdatedOn,
      updatedByUserId: uid,
      matchState: []
    };

    receivedMatches[matchId] = newMatch;
    dispatchSetMatchesList();
    checkNotNull(store.getState().matchesList.find(m => m.matchId === matchId));
    return newMatch;
  }

  export function addMatchMembership(toUserId: string, matchId: string) {
    const matchMembership: fbr.MatchMembership = {
      addedByUid: getUserId(),
      timestamp: getTimestamp()
    };
    const matchMemberships: fbr.MatchMemberships = {
      [matchId]: matchMembership
    };
    refUpdate(getMatchMembershipsRef(toUserId), matchMemberships);
  }
  export function deleteMatchMembership(toUserId: string, matchId: string) {
    refUpdate(getMatchMembershipsRef(toUserId), { [matchId]: null });
  }

  export const MAX_USERS_IN_MATCH = 8;
  export function addParticipant(match: MatchInfo, userId: string) {
    checkCondition('addParticipant', match.participantsUserIds.indexOf(userId) === -1);
    checkCondition('MAX_USERS_IN_MATCH', match.participantsUserIds.length < MAX_USERS_IN_MATCH);
    const matchId = match.matchId;
    const participantNumber = match.participantsUserIds.length;
    const participantUserObj: fbr.ParticipantUser = {
      participantIndex: participantNumber,
      pingOpponents: getTimestamp()
    };
    const toBeFrozenMatch = deepCopy(match);
    toBeFrozenMatch.participantsUserIds.push(userId);
    const updates: AnyIndexer = {};
    updates[`participants/${userId}`] = participantUserObj;
    updateMatch(toBeFrozenMatch, updates);
    addMatchMembership(userId, matchId);
  }

  export function leaveMatch(match: MatchInfo) {
    const uid = getUserId();
    const matchId = match.matchId;
    const myIndex = match.participantsUserIds.indexOf(uid);
    checkCondition('leaveMatch', myIndex >= 0);
    const deleteMatch = match.participantsUserIds.length === 1;
    deleteMatchMembership(uid, matchId);
    ignoredMatches[matchId] = true;
    delete receivedMatches[matchId];
    if (deleteMatch) {
      refSet(getRef(`/gamePortal/matches/${match.matchId}`), null);
    } else {
      refSet(getRef(`/gamePortal/matches/${match.matchId}/participants/${uid}`), null);
    }
    dispatchSetMatchesList();
  }

  // Call this after resetting a match or shuffling a deck.
  export function updateMatchState(match: MatchInfo) {
    console.log('updateMatchState: match=', match.matchId);
    const matchState: MatchState = match.matchState;
    checkCondition('updateMatchState', matchState.length > 0);
    const updates: AnyIndexer = {};
    updates['pieces'] = convertMatchStateToPiecesState(matchState, match.gameSpecId);
    updateMatchUsingCopy(match, updates);
  }

  // Call this after updating a single piece.
  export function updatePieceState(match: MatchInfo, pieceIndex: number) {
    console.log('updatePieceState: pieceIndex=', pieceIndex);
    const pieceState: PieceState = match.matchState[pieceIndex];
    const updates: AnyIndexer = {};
    updates[`pieces/${pieceIndex}`] = convertPieceState(pieceState);
    updateMatchUsingCopy(match, updates);
  }

  function updateMatchUsingCopy(match: MatchInfo, updates: AnyIndexer) {
    updateMatch(deepCopy(match), updates);
  }
  function updateMatch(match: MatchInfo, updates: AnyIndexer) {
    const uid = getUserId();
    match.updatedByUserId = uid;
    match.lastUpdatedOn = new Date().getTime(); // We show the time in the matches list ("updated 3 minutes ago")
    updates['lastUpdatedOn'] = getTimestamp();
    updates['updatedByUserId'] = uid;
    deepFreeze(match);
    receivedMatches[match.matchId] = match;
    dispatchSetMatchesList();
    refUpdate(getRef(`/gamePortal/matches/${match.matchId}`), updates);
  }

  export function checkMatchState(matchState: MatchState, gameSpecId: string) {
    checkMatchStateInStore(matchState, gameSpecId, store.getState());
  }

  function convertPiecesStateToMatchState(
    piecesState: fbr.PiecesState,
    gameSpecId: string
  ): MatchState {
    if (!piecesState) {
      return [];
    }
    const newMatchStates: MatchState = convertObjectToArray(piecesState).map(state =>
      convertFbrPieceState(state.currentState)
    );
    checkMatchState(newMatchStates, gameSpecId);
    return newMatchStates;
  }

  function convertFbrPieceState(pieceState: fbr.CurrentState): PieceState {
    const cardVisibilityPerIndex: CardVisibility = {};
    if (pieceState.cardVisibility) {
      for (let visibleToIndex of Object.keys(pieceState.cardVisibility)) {
        cardVisibilityPerIndex[visibleToIndex] = true;
      }
    }
    return {
      x: pieceState.x,
      y: pieceState.y,
      zDepth: pieceState.zDepth,
      currentImageIndex: pieceState.currentImageIndex,
      cardVisibilityPerIndex: cardVisibilityPerIndex
    };
  }
  function validateInteger(num: number, fromInclusive: number, toInclusive: number) {
    return validateNumber(num, fromInclusive, toInclusive, true);
  }
  function validateNumber(
    num: number,
    fromInclusive: number,
    toInclusive: number,
    isInteger: boolean = false
  ) {
    if (isInteger) {
      checkCondition(arguments, num % 1 === 0.0);
    }
    checkCondition(
      arguments,
      typeof num === 'number' && num >= fromInclusive && num <= toInclusive
    );
  }
  function convertPieceState(pieceState: PieceState): fbr.PieceState {
    validateNumber(pieceState.x, -100, 100);
    validateNumber(pieceState.y, -100, 100);
    validateNumber(pieceState.zDepth, 1, 100000000000000000);
    validateInteger(pieceState.currentImageIndex, 0, 256);
    return {
      currentState: {
        x: pieceState.x,
        y: pieceState.y,
        zDepth: pieceState.zDepth,
        currentImageIndex: pieceState.currentImageIndex,
        cardVisibility: pieceState.cardVisibilityPerIndex,
        rotationDegrees: 360,
        drawing: {}
      }
    };
  }
  function convertMatchStateToPiecesState(
    matchState: MatchState,
    gameSpecId: string
  ): fbr.PiecesState {
    const piecesState: fbr.PiecesState = {};
    checkMatchState(matchState, gameSpecId);
    let pieceIndex = 0;
    console.log(matchState);
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
      getRef(`/gamePortal/matches/${matchId}/participants/${userId}/pingOpponents`),
      getTimestamp()
    );
  }

  function storeContactsAfterLogin() {
    const uid = getUserId();
    const currentContacts = checkNotNull(contactsToBeStored!);
    const currentPhoneNumbers = Object.keys(currentContacts);
    currentPhoneNumbers.forEach(phoneNumber => checkPhoneNumIsValid(phoneNumber));
    // Max contactName is 20 chars
    currentPhoneNumbers.forEach(phoneNumber => {
      const contact = currentContacts[phoneNumber];
      if (contact.name.length > 17) {
        contact.name = contact.name.substr(0, 17) + '…';
      }
      if (contact.name.length === 0) {
        contact.name = UNKNOWN_NAME;
      }
    });
    const state = store.getState();

    // Mapping phone number to userId for those numbers that don't have a userId.
    const phoneNumberToInfo = getPhoneNumberToUserInfo(state.userIdToInfo);
    const numbersWithoutUserId = currentPhoneNumbers.filter(
      phoneNumber => phoneNumberToInfo[phoneNumber] === undefined
    );
    mapPhoneNumbersToUserIds(numbersWithoutUserId);

    const updates: AnyIndexer = {};
    const oldContacts = state.phoneNumberToContact;
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
      refUpdate(getRef(`/gamePortal/gamePortalUsers/${uid}/privateFields/contacts`), updates);
    }

    dispatch({ updatePhoneNumberToContact: currentContacts });
  }

  function mapPhoneNumbersToUserIds(phoneNumbers: string[]) {
    const userIdToInfo: UserIdToInfo = {};
    const promises: Promise<void>[] = [];
    phoneNumbers.forEach((phoneNumber: string) => {
      promises.push(addToUserIdToInfo(userIdToInfo, phoneNumber));
    });
    Promise.all(promises).then(() => {
      dispatch({ updateUserIdToInfo: userIdToInfo });
    });
  }

  function addToUserIdToInfo(userIdToInfo: UserIdToInfo, phoneNumber: string): Promise<void> {
    return getUserIdFromPhoneNumber(phoneNumber).then(userId => {
      if (!userId) {
        return;
      }
      // Note that users may have their own number in their contacts.
      // I don't want to exclude it here because then that number will show up in contactsList under "Invite".
      userIdToInfo[userId] = {
        phoneNumber,
        displayName: '',
        userId
      };
    });
  }

  function addUserInfo(userId: string, displayName: string) {
    const userIdInfo: UserIdToInfo = {
      [userId]: { userId, displayName }
    };

    dispatch({ updateUserIdToInfo: userIdInfo });
  }

  export function searchPhoneNumber(phoneNumber: string): Promise<ContactWithUserId | null> {
    return getUserIdFromPhoneNumber(phoneNumber).then(userId => {
      if (!userId) {
        return null;
      }
      let promise: Promise<ContactWithUserId | null> = getDisplayNameForUserId(userId).then(
        displayName => {
          addUserInfo(userId, displayName);
          return {
            userId: userId,
            phoneNumber: phoneNumber,
            name: displayName
          };
        }
      );
      return promise;
    });
  }

  function getDisplayNameForUserId(userId: string): Promise<string> {
    return getOnce(`/gamePortal/gamePortalUsers/${userId}/publicFields/displayName`).then(
      displayName => displayName || UNKNOWN_NAME
    );
  }

  function getUserIdFromPhoneNumber(phoneNumber: string): Promise<string | null> {
    checkPhoneNumIsValid(phoneNumber);
    return getOnce(`/gamePortal/phoneNumberToUserId/` + phoneNumber).then(
      (phoneNumberFbrObj: fbr.PhoneNumber) => {
        if (!phoneNumberFbrObj) {
          return null;
        }
        return phoneNumberFbrObj.userId;
      }
    );
  }

  // Dispatches setSignals.
  function listenToSignals() {
    const userId = getUserId();
    const ref = getRef(`/gamePortal/gamePortalUsers/${userId}/privateButAddable/signals`);
    ref.on('value', snap => {
      if (!snap) {
        return;
      }
      const signalsFbr: fbr.Signals = snap.val();
      if (!signalsFbr) {
        return;
      }
      // We start with the old signals and add to them.
      let signals: SignalEntry[] = shallowCopy(store.getState().signals);
      let updates: AnyIndexer = {};
      Object.keys(signalsFbr).forEach(entryId => {
        updates[entryId] = null;
        const signalFbr: fbr.SignalEntry = signalsFbr[entryId];
        const signal: SignalEntry = signalFbr;
        signals.push(signal);
      });

      // Deleting the signals we got from firebase.
      refUpdate(ref, updates);

      // filtering old signals isn't needed.
      // const now = new Date().getTime();
      // const fiveMinAgo = now - 5 * 60 * 1000;
      // signals = signals.filter(signal => fiveMinAgo <= signal.timestamp);

      // Sorting: oldest entries are at the beginning
      signals.sort((signal1, signal2) => signal1.timestamp - signal2.timestamp);

      dispatch({ setSignals: signals });
    });
  }

  export function sendSignal(
    toUserId: string,
    signalType: 'sdp1' | 'sdp2' | 'candidate',
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
    // If we disconnect, cleanup the signal.
    signalFbrRef.onDisconnect().remove();
  }

  declare let ContactFindOptions: any;
  export function fetchContacts() {
    if (!isApp) {
      return;
    }
    if (!navigator.contacts) {
      Raven.captureMessage('No navigator.contacts!');
      return;
    }
    console.log('Fetching contacts');

    var options = new ContactFindOptions();
    options.filter = '';
    options.multiple = true;
    options.desiredFields = [
      navigator.contacts.fieldType.displayName,
      navigator.contacts.fieldType.phoneNumbers
    ];
    options.hasPhoneNumber = true;
    const onSuccess = (contacts: any[]) => {
      console.log('Successfully got contacts: ', contacts);
      let myCountryCode = store.getState().myUser.myCountryCode;
      if (!myCountryCode) {
        console.error('Missing country code');
        return;
      }
      if (!contacts) {
        console.error('Missing contacts');
        return;
      }
      let currentContacts: PhoneNumberToContact = {};
      for (let contact of contacts) {
        if (!contact.phoneNumbers) {
          continue;
        }
        for (let phoneNumber of contact.phoneNumbers) {
          const localNumber = phoneNumber['value'].replace(/[^0-9]/g, '');
          const phoneInfo = checkPhoneNumber(localNumber, myCountryCode);
          if (
            phoneInfo &&
            phoneInfo.isPossibleNumber &&
            phoneInfo.isValidNumber &&
            phoneInfo.maybeMobileNumber
          ) {
            const internationalNumber = phoneInfo.e164Format;
            if (checkPhoneNumIsValid(internationalNumber)) {
              console.error('e164Format returned illegal phone number:', internationalNumber);
              continue;
            }
            const newContact: Contact = {
              name: contact.displayName,
              phoneNumber: internationalNumber
            };
            currentContacts[internationalNumber] = newContact;
          }
        }
      }
      storeContacts(currentContacts);
    };

    const onError = () => {
      console.error('Error fetching contacts');
    };
    navigator.contacts.find(['*'], onSuccess, onError, options);
  }

  function storeFcmTokensAfterLogin() {
    if (fcmTokensToBeStored.length === 0) {
      return;
    }
    const updates: AnyIndexer = {};
    for (let token of fcmTokensToBeStored) {
      const fcmTokenObj: fbr.FcmToken = {
        lastTimeReceived: <any>firebase.database.ServerValue.TIMESTAMP,
        platform: token.platform
      };
      updates[token.fcmToken] = fcmTokenObj;
    }
    fcmTokensToBeStored = [];
    refUpdate(
      getRef(`/gamePortal/gamePortalUsers/${getUserId()}/privateFields/fcmTokens/`),
      updates
    );
  }

  function addPromiseForTests(promise: Promise<any>) {
    if (allPromisesForTests) {
      allPromisesForTests.push(promise);
    }
    return promise;
  }

  function getOnce(path: string): Promise<any> {
    const promise = getRef(path)
      .once('value')
      .then(snap => {
        if (!snap) {
          return null;
        }
        return snap.val();
      })
      .catch(() => {
        console.warn('Failed fetching ref=', path);
        return null;
      });
    addPromiseForTests(promise);
    return promise;
  }

  function refSet(ref: firebase.database.Reference, val: any) {
    addPromiseForTests(ref.set(val, getOnComplete(ref, val)));
  }

  function refUpdate(ref: firebase.database.Reference, val: AnyIndexer) {
    addPromiseForTests(ref.update(val, getOnComplete(ref, val)));
  }

  function getOnComplete(ref: firebase.database.Reference, val: any) {
    // console.log('Setting ref=', ref.toString(), " to value=", prettyJson(val));
    return (err: Error | null) => {
      // on complete
      if (err) {
        let msg = 'Failed writing to ref=' + ref.toString() + ` value=` + prettyJson(val);
        console.error(msg);
        Raven.captureMessage(msg);
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
