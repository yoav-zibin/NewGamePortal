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
  Image,
  StoreState,
  MatchState,
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

it('setMatchesList', () => {
  let matchesList = [matchInfo];
  let action: Action = {
    setMatchesList: matchesList
  };
  let initialState = storeStateDefault;
  let { matchIdToMatchState } = initialState;
  let newMatchIdToMatchState: MatchIdToMatchState = {};
  matchesList.forEach(e => {
    if (e.matchId in matchIdToMatchState) {
      newMatchIdToMatchState[e.matchId] = matchIdToMatchState[e.matchId];
    } else {
      newMatchIdToMatchState[e.matchId] = {};
    }
  });
  const expectedState = {
    ...storeStateDefault,
    matchesList: matchesList,
    matchIdToMatchState: newMatchIdToMatchState
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
  const initialState = storeStateDefault;
  let { matchIdToMatchState, ...rest } = initialState;
  var someId = '';
  var count = 0;
  // select a random matchId to update
  for (var prop in matchIdToMatchState) {
    if (Math.random() < 1 / ++count) {
      someId = prop;
    }
  }
  let someMatchState: MatchState = {};
  let newMatchIdToMatchState: MatchIdToMatchState = {};
  newMatchIdToMatchState[someId] = someMatchState;
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

// TODO: add tests for all other reducers.
