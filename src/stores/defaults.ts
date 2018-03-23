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
  // state.gameSpecs.gameSpecIdToGameSpec[match.gameSpecId].pieces.length
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {
      '456': {
        gameSpecId: '456',
        board: {
          imageId: '456',
          width: 1,
          height: 2,
          isBoardImage: true,
          downloadURL: 'https://someurl.com/foo.png'
        },
        pieces: [
          {
            element: {
              elementId: '123',
              width: 23,
              height: 23,
              images: [],
              isDraggable: true,
              elementKind: 'standard'
            },
            initialState: {
              x: 1,
              y: 2,
              zDepth: 3,
              currentImageIndex: 4,
              cardVisibilityPerIndex: {}
            },
            deckPieceIndex: 1
          }
        ]
      }
    }
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
      matchState: [
        {
          x: 1,
          y: 2,
          zDepth: 3,
          currentImageIndex: 4,
          cardVisibilityPerIndex: {}
        }
      ]
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
