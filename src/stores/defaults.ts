import { StoreState, Image } from '../types';

let image: Image = {
  imageId: '',
  width: 100,
  height: 100,
  isBoardImage: false,
  downloadURL: 'blabla.png',
};
let gameSpec: any = null;

export const storeStateDefault: StoreState = {
  gamesList: [
    {
      gameSpecId: '123',
      gameName: '3 Men Chess',
      screenShoot: image,
      gameSpec: gameSpec,
    },
    {
      gameSpecId: '456',
      gameName: 'Checkers',
      screenShoot: image,
      gameSpec: gameSpec,
    },
  ],
  matchesList: [],
  currentMatchIndex: -1,
  contacts: [],
  users: [],
};
