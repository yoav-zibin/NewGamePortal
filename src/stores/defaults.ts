import { StoreState } from '../types';

export const storeStateDefault: StoreState = {
  gamesList: [
    {
      gameSpecId: '123',
      gameName: '3 Men Chess',
      screenShot: {
        imageId: 'someImageId',
        downloadURL: 'https://someurl.com/foo.png',
        height: 1024,
        width: 700,
        isBoardImage: true
      }
    },
    {
      gameSpecId: '456',
      gameName: 'Checkers',
      screenShot: {
        imageId: 'someImageId',
        downloadURL: 'https://someurl.com/foo.png',
        height: 1024,
        width: 700,
        isBoardImage: true
      }
    }
  ],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [
    {
      matchId: 'someId',
      gameSpecId: '456',
      game: {
        gameSpecId: '456',
        gameName: 'Checkers',
        screenShot: {
          imageId: 'someImageId',
          downloadURL: 'https://someurl.com/foo.png',
          height: 1024,
          width: 700,
          isBoardImage: true
        }
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1234,
      matchState: []
    }
  ],
  currentMatchIndex: -1,
  phoneNumberToContact: {},
  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {},
    userIdToPhoneNumber: {}
  },
  myUser: {
    myPhoneNumber: '',
    myCountryCode: '',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: []
};
