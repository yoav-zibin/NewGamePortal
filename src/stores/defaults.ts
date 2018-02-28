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
      screenShoot: image
    },
    {
      gameSpecId: '456',
      gameName: 'Checkers',
      screenShoot: image
    }
  ],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [
    {
      matchId: '1',
      game: {
        gameSpecId: '123',
        gameName: '3 Men Chess',
        screenShoot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1234
    },
    {
      matchId: '2',
      game: {
        gameSpecId: '456',
        gameName: 'Checkers',
        screenShoot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1564
    }
  ],
  currentMatchIndex: 1,
  matchIdToMatchState: {},
  phoneNumberToContact: {
    phoneNumber: {
      phoneNumber: '+1234567890',
      name: 'someName',
      avatarImage: 'someImage'
    }
  },
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
