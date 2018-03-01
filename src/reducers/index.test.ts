/**
 * @jest-environment node
 */
import { reducer, Action, mergeMaps } from './index';
import { storeStateDefault } from '../stores/defaults';
import {
  GameInfo,
  MatchInfo,
  MyUser,
  SignalEntry,
  Contact,
  PhoneNumberToContact,
  Image,
  StoreState,
  MatchIdToMatchState
} from '../types';

const image: Image = {
  imageId: 'someImageId',
  downloadURL: 'https://someurl.com/foo.png',
  height: 1024,
  width: 700,
  isBoardImage: true
};

const gameInfo: GameInfo = {
  gameSpecId: 'someId',
  gameName: 'Some game name',
  screenShoot: image
};

const matchInfo: MatchInfo = {
  matchId: 'someId',
  game: gameInfo,
  participantsUserIds: [], // including myself
  lastUpdatedOn: 1234 /*firebase.database.ServerValue.TIMESTAMP*/
};

const userInfo: MyUser = {
  myUserId: 'someId',
  myPhoneNumber: 'Some phone number'
};

const sigEntry: SignalEntry = {
  addedByUid: 'someId',
  timestamp: 1234 /*firebase.database.ServerValue.TIMESTAMP*/,
  signalType: 'sdp',
  signalData: 'some String'
};

const currentMatchIndex: number = 1;

function reduce(state: StoreState, action: Action): StoreState {
  return reducer(state, <any>action);
}

it('get initial state', () => {
  expect(reduce(<any>undefined, {})).toEqual(storeStateDefault);
});

it('setGamesList', () => {
  let gamesList = [gameInfo];
  let action: Action = {
    setGamesList: gamesList
  };
  let initialState = storeStateDefault;
  const expectedState = { ...storeStateDefault, gamesList: gamesList };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setMatchesList (and updates currentMatchIndex accordingly)', () => {
  let matchesList = [matchInfo];
  let action: Action = {
    setMatchesList: matchesList
  };
  let initialState = storeStateDefault;
  const expectedState = {
    ...storeStateDefault,
    matchesList: matchesList,
    currentMatchIndex: -1
  };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setSignals', () => {
  let signalsList = [sigEntry];
  let action: Action = {
    setSignals: signalsList
  };
  let initialState = storeStateDefault;
  const expectedState = { ...storeStateDefault, signals: signalsList };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setMyUser', () => {
  let userDetails = userInfo;
  let action: Action = {
    setMyUser: userDetails
  };
  let initialState = storeStateDefault;
  const expectedState = { ...storeStateDefault, myUser: userDetails };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setCurrentMatchIndex', () => {
  let currentIndex = currentMatchIndex;
  let action: Action = {
    setCurrentMatchIndex: currentIndex
  };
  const initialState = storeStateDefault;
  const expectedState = {
    ...storeStateDefault,
    currentMatchIndex: currentIndex
  };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('updateMatchIdToMatchState', () => {
  let initialState = storeStateDefault;
  let { matchIdToMatchState, ...rest } = initialState;

  let newMatchIdToMatchState: MatchIdToMatchState = {};
  newMatchIdToMatchState['1'] = {
    somePieceId: {
      x: 0,
      y: 0,
      zDepth: 0,
      currentImageIndex: 0,
      cardVisibility: {}
    }
  };

  let action: Action = {
    updateMatchIdToMatchState: newMatchIdToMatchState
  };

  const expectedState = {
    matchIdToMatchState: mergeMaps(
      storeStateDefault.matchIdToMatchState,
      newMatchIdToMatchState
    ),
    ...rest
  };

  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('set matchesList to empty list (and updates currentMatchIndex accordingly)', () => {
  const initialState = storeStateDefault;
  let { matchesList, matchIdToMatchState, ...rest } = initialState;

  let newMatches: MatchInfo[] = [];
  let action: Action = {
    setMatchesList: newMatches
  };

  const expectedState = {
    ...rest,
    matchesList: newMatches,
    matchIdToMatchState: {},
    currentMatchIndex: -1
  };

  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('updatePhoneNumberToContact', () => {
  const initialState = storeStateDefault;
  let { phoneNumberToContact, ...rest } = initialState;

  let someContact: Contact = {
    phoneNumber: '+1234567890',
    name: 'someName',
    avatarImage: 'someImage'
  };

  let newPhoneNumberToContact: PhoneNumberToContact = {};
  newPhoneNumberToContact['+1234567890'] = someContact;

  let action: Action = {
    updatePhoneNumberToContact: newPhoneNumberToContact
  };

  const expectedState = {
    phoneNumberToContact: mergeMaps(
      storeStateDefault.phoneNumberToContact,
      newPhoneNumberToContact
    ),
    ...rest
  };

  expect(reduce(initialState, action)).toEqual(expectedState);
});

// TODO: add tests for all other reducers.
