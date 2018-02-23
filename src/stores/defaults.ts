import { StoreState, Image } from '../types';

let image: Image = {
  imageId: '',
  width: 100,
  height: 100,
  isBoardImage: false,
  downloadURL: './images/3 Men Chess.png',
};
let gameSpec: any = null;

export const storeStateDefault: StoreState = {
  gamesList: [
    {
      gameSpecId: '',
      gameName: '3 Men Chess',
      screenShoot: image,
      gameSpec: gameSpec,
    },
    {
      gameSpecId: '',
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
