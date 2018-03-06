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
  gameSpecId: 'someId',
  gameName: 'Some game name',
  screenShoot: image
};

const matchInfo: MatchInfo = {
  matchId: 'someId',
  game: gameInfo,
  participantsUserIds: [], // including myself
  lastUpdatedOn: 1234,
  matchState: {}
};

const userInfo: MyUser = {
  myUserId: 'someId',
  myPhoneNumber: 'Some phone number',
  myCountryCode: ''
};

const sigEntry: SignalEntry = {
  addedByUid: 'someId',
  timestamp: 1234,
  signalType: 'sdp',
  signalData: 'some String'
};

const currentMatchIndex: number = 1;

const initialState: StoreState = {
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
      lastUpdatedOn: 1234,
      matchState: {}
    },
    {
      matchId: '2',
      game: {
        gameSpecId: '456',
        gameName: 'Checkers',
        screenShoot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1564,
      matchState: {}
    }
  ],
  currentMatchIndex: 1,
  phoneNumberToContact: {
    phoneNumber: {
      phoneNumber: '+1234567890',
      name: 'someName',
      avatarImage: 'someImage'
    }
  },
  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {
      '+1234': '999'
    },
    userIdToPhoneNumber: {
      '999': '+1234'
    }
  },
  myUser: {
    myPhoneNumber: '111111111',
    myCountryCode: '',
    myUserId: '7UbETkgeXxe0RId6KxYioSJdARs1'
  },
  signals: [
    {
      addedByUid: '7UbETkgeXxe0RId6KxYioSJdARs1',
      timestamp: 1234,
      signalType: 'sdp',
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

it('setMatchesList (and updates currentMatchIndex accordingly)', () => {
  let matchesList = [matchInfo];
  let action: Action = {
    setMatchesList: matchesList
  };
  const expectedState = {
    ...initialState,
    matchesList: matchesList,
    currentMatchIndex: -1
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

it('setCurrentMatchIndex', () => {
  let currentIndex = currentMatchIndex;
  let action: Action = {
    setCurrentMatchIndex: currentIndex
  };
  const expectedState = {
    ...initialState,
    currentMatchIndex: currentIndex
  };
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('set matchesList to empty list (and updates currentMatchIndex accordingly)', () => {
  let { matchesList, ...rest } = initialState;

  let newMatches: MatchInfo[] = [];
  let action: Action = {
    setMatchesList: newMatches
  };

  const expectedState = {
    ...rest,
    matchesList: newMatches,
    currentMatchIndex: -1
  };

  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('updatePhoneNumberToContact', () => {
  let { phoneNumberToContact, ...rest } = initialState;

  let someContact: Contact = {
    phoneNumber: '+1234567890',
    name: 'someName',
    avatarImage: 'someImage'
  };

  let newPhoneNumberToContact: PhoneNumberToContact = {};
  newPhoneNumberToContact['+1234567890'] = someContact;

  let action: Action = {
    updatePhoneNumberToContact: newPhoneNumberToContact
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
