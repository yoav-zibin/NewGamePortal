import { StoreState, Image } from '../types';

let image: Image = {
  imageId: '',
  width: 100,
  height: 100,
  isBoardImage: false,
  downloadURL: 'blabla.png'
};

export const storeStateDefault: StoreState = {
  // This initial gamesList is just for debugging the components.
  // TODO: change to [] once firebase is finished.
  gamesList: [
    {
      gameSpecId: '123',
      gameName: '3 Men Chess',
      screenShot: image
    },
    {
      gameSpecId: '456',
      gameName: 'Checkers',
      screenShot: image
    }
  ],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  currentMatchIndex: -1,
  matchIdToMatchState: {},
  phoneNumberToContact: {},

  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {},
    userIdToPhoneNumber: {}
  },
  myUser: {
    myPhoneNumber: '111111111',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: [
    {
      addedByUid: '7UbETkgeXxe0RId6KxYioSJdARs1',
      timestamp: 1234 /*firebase.database.ServerValue.TIMESTAMP*/,
      signalType: 'sdp',
      signalData: '3 Men Chess'
    }
  ]
};
