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
  // This initial gamesList is just for debugging the components.
  // TODO: change to [] once firebase is finished.
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
  imageIdToImage: {},
  elementIdToElement: {},
  matchesList: [],
  currentMatchIndex: -1,
  contacts: [],
  phoneNumberToUserId: {},
  userIdToPhoneNumber: {},
  myUserId: '',
};
