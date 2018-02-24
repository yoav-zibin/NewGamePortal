/**
 * @jest-environment node
 */
import { reducer, Action } from './index';
import { storeStateDefault } from '../stores/defaults';
import { GameInfo, Image, StoreState } from '../types';

const image: Image = {
  imageId: 'someImageId',
  downloadURL: 'https://someurl.com/foo.png',
  height: 1024,
  width: 700,
  isBoardImage: true,
};

const gameInfo: GameInfo = {
  gameSpecId: 'someId',
  gameName: 'Some game name',
  screenShoot: image,
};

function reduce(state: StoreState, action: Action): StoreState {
  return reducer(state, <any> action);
}

it('get initial state', () => {
  expect(reduce(<any> undefined, {})).toEqual(storeStateDefault);
});

it('setGamesList', () => {
  let gamesList = [gameInfo];
  let action: Action = {
    setGamesList: gamesList
  };
  let initialState = storeStateDefault;
  let expectedState = Object.assign(storeStateDefault, {gamesList: gamesList});
  expect(reduce(initialState, action)).toEqual(expectedState);
});

// TODO: add tests for all other reducers.