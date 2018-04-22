/**
 * @jest-environment node
 */
import { reducer, Action, mergeMaps } from './index';
import { storeStateDefault } from '../stores/defaults';
import {
  GameInfo,
  MatchInfo,
  MyUser,
  SignalEntry,
  Contact,
  PhoneNumberToContact,
  UserIdsAndPhoneNumbers,
  Image,
  StoreState
} from '../types';

const image: Image = {
  imageId: 'someImageId',
  downloadURL: 'https://someurl.com/foo.png',
  height: 1024,
  width: 700,
  isBoardImage: true
};

const gameInfo: GameInfo = {
  gameSpecId: '123',
  gameName: 'Some game name',
  screenShot: image
};

const matchInfo: MatchInfo = {
  matchId: 'someId',
  gameSpecId: gameInfo.gameSpecId,
  game: gameInfo,
  participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
  lastUpdatedOn: 1234,
  matchState: []
};

const userInfo: MyUser = {
  myName: 'Some name',
  myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1',
  myPhoneNumber: 'Some phone number',
  myCountryCode: ''
};

const sigEntry: SignalEntry = {
  addedByUid: 'someId',
  timestamp: 1234,
  signalType: 'sdp1',
  signalData: 'some String'
};

const initialState: StoreState = {
  // This initial gamesList is just for debugging the components.
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
      lastUpdatedOn: 1564,
      matchState: []
    }
  ],
  phoneNumberToContact: {
    phoneNumber: {
      phoneNumber: '+1234567890',
      name: 'someName'
    }
  },
  userIdToInfo: {},
  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {
      '+1234': '999'
    },
    userIdToPhoneNumber: {
      '999': '+1234'
    }
  },
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

function reduce(state: StoreState, action: Action): StoreState {
  return reducer(state, <any>action);
}

it('get initial state', () => {
  expect(reduce(<any>undefined, {})).toEqual(storeStateDefault);
});

it('setGamesList', () => {
  let gamesList = [gameInfo];
  let action: Action = {
    setGamesList: gamesList
  };
  const expectedState = { ...initialState, gamesList: gamesList };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setMatchesList', () => {
  let matchesList = [matchInfo];
  let action: Action = {
    setMatchesList: matchesList
  };
  const expectedState = {
    ...initialState,
    matchesList: matchesList
  };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setSignals', () => {
  let signalsList = [sigEntry];
  let action: Action = {
    setSignals: signalsList
  };
  const expectedState = { ...initialState, signals: signalsList };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('setMyUser', () => {
  let userDetails = userInfo;
  let action: Action = {
    setMyUser: userDetails
  };
  const expectedState = { ...initialState, myUser: userDetails };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('set matchesList to empty list', () => {
  let { matchesList, ...rest } = initialState;

  let newMatches: MatchInfo[] = [];
  let action: Action = {
    setMatchesList: newMatches
  };

  const expectedState = {
    ...rest,
    matchesList: newMatches
  };

  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('updatePhoneNumberToContact', () => {
  let { phoneNumberToContact, ...rest } = initialState;

  let someContact: Contact = {
    phoneNumber: '+1234567890',
    name: 'someName'
  };

  let newPhoneNumberToContact: PhoneNumberToContact = {};
  newPhoneNumberToContact['+1234567890'] = someContact;

  let action: Action = {
    updatePhoneNumberToContact: newPhoneNumberToContact,
  };

  const expectedState = {
    phoneNumberToContact: mergeMaps(
      initialState.phoneNumberToContact,
      newPhoneNumberToContact
    ),
    ...rest
  };

  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('updateUserIdsAndPhoneNumbers', () => {
  let { userIdsAndPhoneNumbers, ...rest } = initialState;

  let newUserIdsAndPhoneNumbers: UserIdsAndPhoneNumbers = {
    phoneNumberToUserId: { x: 'y', z: 'u' },
    userIdToPhoneNumber: { y: 'x', u: 'z' }
  };
  let action: Action = {
    updateUserIdsAndPhoneNumbers: newUserIdsAndPhoneNumbers
  };

  const expectedState = {
    userIdsAndPhoneNumbers: {
      phoneNumberToUserId: mergeMaps(
        initialState.userIdsAndPhoneNumbers.phoneNumberToUserId,
        newUserIdsAndPhoneNumbers.phoneNumberToUserId
      ),
      userIdToPhoneNumber: mergeMaps(
        initialState.userIdsAndPhoneNumbers.userIdToPhoneNumber,
        newUserIdsAndPhoneNumbers.userIdToPhoneNumber
      )
    },
    ...rest
  };
  expect(reduce(initialState, action)).toEqual(expectedState);
});
