/**
 * @jest-environment node
 */
import { reducer, Action } from './index';
import { storeStateDefault } from '../stores/defaults';
import { GameInfo, MyUser, SignalEntry, Image, StoreState } from '../types';

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
  screenShot: image
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

function reduce(state: StoreState, action: Action): StoreState {
  return reducer(state, <any>action);
}

it('get initial state', () => {
  expect(reduce(<any>undefined, {})).toEqual(storeStateDefault);
});

it('setGamesList', () => {
  const gamesList = [gameInfo];
  const action: Action = {
    setGamesList: gamesList
  };
  const initialState = storeStateDefault;
  const expectedState = { ...storeStateDefault, gamesList: gamesList };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setSignals', () => {
  const signalsList = [sigEntry];
  const action: Action = {
    setSignals: signalsList
  };
  const initialState = storeStateDefault;
  const expectedState = { ...storeStateDefault, signals: signalsList };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setMyUser', () => {
  const userDetails = userInfo;
  const action: Action = {
    setMyUser: userDetails
  };
  const initialState = storeStateDefault;
  const expectedState = { ...storeStateDefault, myUser: userDetails };
  expect(reduce(initialState, action)).toEqual(expectedState);
});
// TODO: add tests for all other reducers.
