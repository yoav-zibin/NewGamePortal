import { trimState } from './index';
import { storeStateDefault } from '../stores/defaults';
import { Image, StoreState } from '../types';

const image: Image = {
  imageId: 'someImageId',
  downloadURL: 'https://someurl.com/foo.png',
  height: 1024,
  width: 700,
  isBoardImage: true
};

const initialContact = {
  phoneNumber: '+1234567890',
  name: 'contact name'
};

// Define different states to input into
// trimState in order to test its different return values
// todo: move into test 
const noChangeState: StoreState = {
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
    imageIdToImage: {
      [image.imageId]: image
    },
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  phoneNumberToContact: {},
  userIdToInfo: {},
  myUser: {
    myName: 'Name 111',
    myPhoneNumber: '111111111',
    myCountryCode: '',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: [
    {
      addedByUid: '7UbETkgeXxe0RId6KxYioSJdARs1',
      timestamp: 1234,
      signalType: 'sdp1',
      signalData: '3 Men Chess'
    }
  ]
};

const phoneState: StoreState = {
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
    imageIdToImage: {
      [image.imageId]: image
    },
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  phoneNumberToContact: {
    [initialContact.phoneNumber]: initialContact
  },
  userIdToInfo: {},
  myUser: {
    myName: 'Name 111',
    myPhoneNumber: '111111111',
    myCountryCode: '',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: [
    {
      addedByUid: '7UbETkgeXxe0RId6KxYioSJdARs1',
      timestamp: 1234,
      signalType: 'sdp1',
      signalData: '3 Men Chess'
    }
  ]
};
const timestampState: StoreState = {
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
    imageIdToImage: {
      [image.imageId]: image
    },
    elementIdToElement: {},
    gameSpecIdToGameSpec: {
      '123': {
        gameSpecId: '123',
        board: image,
        pieces: []
      },
      '456': {
        gameSpecId: '456',
        board: image,
        pieces: []
      }
    }
  },
  matchesList: [
    {
      matchId: '1',
      gameSpecId: '123',
      game: {
        gameSpecId: '123',
        gameName: '3 Men Chess',
        screenShot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1234,
      matchState: []
    },
    {
      matchId: '2',
      gameSpecId: '456',
      game: {
        gameSpecId: '456',
        gameName: 'Checkers',
        screenShot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 5678,
      matchState: []
    }
  ],
  phoneNumberToContact: {
    [initialContact.phoneNumber]: initialContact
  },
  userIdToInfo: {},
  myUser: {
    myName: 'Name 111',
    myPhoneNumber: '111111111',
    myCountryCode: '',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: [
    {
      addedByUid: '7UbETkgeXxe0RId6KxYioSJdARs1',
      timestamp: 1234,
      signalType: 'sdp1',
      signalData: '3 Men Chess'
    }
  ]
};

const gameSpecState: StoreState = {
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
    imageIdToImage: {
      [image.imageId]: image
    },
    elementIdToElement: {},
    gameSpecIdToGameSpec: {
      '123': {
        gameSpecId: '123',
        board: image,
        pieces: []
      },
      '456': {
        gameSpecId: '456',
        board: image,
        pieces: []
      },
      '789': {
        gameSpecId: '789',
        board: image,
        pieces: []
      }
    }
  },
  matchesList: [
    {
      matchId: '1',
      gameSpecId: '123',
      game: {
        gameSpecId: '123',
        gameName: '3 Men Chess',
        screenShot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1234,
      matchState: []
    },
    {
      matchId: '2',
      gameSpecId: '456',
      game: {
        gameSpecId: '456',
        gameName: 'Checkers',
        screenShot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 5678,
      matchState: []
    }
  ],
  phoneNumberToContact: {
    [initialContact.phoneNumber]: initialContact
  },
  userIdToInfo: {},
  myUser: {
    myName: 'Name 111',
    myPhoneNumber: '111111111',
    myCountryCode: '',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: [
    {
      addedByUid: '7UbETkgeXxe0RId6KxYioSJdARs1',
      timestamp: 1234,
      signalType: 'sdp1',
      signalData: '3 Men Chess'
    }
  ]
};

it('Deletes unused gameSpecs, if there', () => {
  const oldLength = Object.keys(gameSpecState.gameSpecs.gameSpecIdToGameSpec)
    .length;
  const newState = trimState(gameSpecState);
  const newLength = Object.keys(newState.gameSpecs.gameSpecIdToGameSpec).length;
  expect(newLength).toEqual(oldLength - 1);
});

it('Deletes Match with oldest timestamp, if there', () => {
  const newState = trimState(timestampState);
  // todo: test that the delete performed is on the oldest one
  expect(newState.matchesList.length).toEqual(1);
});

it('Deletes phoneNumberToContact if there', () => {
  const newState = trimState(phoneState);
  expect(Object.keys(newState.phoneNumberToContact).length).toEqual(0);
});

it('Returns default state with user otherwise', () => {
  const newState = trimState(noChangeState);
  const expectedState = storeStateDefault;
  expectedState.myUser = noChangeState.myUser;
  expect(newState).toEqual(expectedState);
});
