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
  Image,
  StoreState,
  UserIdToInfo
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
  wikipediaUrl: '',
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
const initialContact = {
  phoneNumber: '+1234567890',
  name: 'contact name'
};
const initialState: StoreState = {
  // This initial gamesList is just for debugging the components.
  gamesList: [
    {
      gameSpecId: '123',
      gameName: '3 Men Chess',
      wikipediaUrl: '',
      screenShot: image
    },
    {
      gameSpecId: '456',
      gameName: 'Checkers',
      wikipediaUrl: '',
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
        wikipediaUrl: '',
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
        wikipediaUrl: '',
        screenShot: image
      },
      participantsUserIds: ['7UbETkgeXxe0RId6KxYioSJdARs1'], // including myself
      lastUpdatedOn: 1564,
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
  ],
  audioMute: false
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
    name: 'new name'
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
  expect(
    initialState.phoneNumberToContact[initialContact.phoneNumber].name
  ).toEqual(initialContact.name);
  expect(reduce(initialState, action)).toEqual(expectedState);
});

it('updateUserInfos', () => {
  const userId = 'abc';
  const userId2 = 'abcd';
  const user2 = {
    userId: userId2,
    displayName: 'whatever name2'
  };
  let userIdToInfo: UserIdToInfo = {
    [userId]: {
      userId,
      displayName: 'user chosen name',
      phoneNumber: initialContact.phoneNumber
    },
    [userId2]: user2
  };
  let action: Action = {
    updateUserIdToInfo: userIdToInfo
  };

  const expectedState = {
    ...initialState,
    userIdToInfo: {
      [userId]: {
        userId,
        displayName: initialContact.name,
        phoneNumber: initialContact.phoneNumber
      },
      [userId2]: user2
    }
  };
  expect(reduce(initialState, action)).toEqual(expectedState);
});
