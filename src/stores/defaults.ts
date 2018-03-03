import { StoreState } from '../types';

export const storeStateDefault: StoreState = {
  gamesList: [],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  currentMatchIndex: -1,
  phoneNumberToContact: {},
  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {},
    userIdToPhoneNumber: {}
  },
  myUser: {
    myPhoneNumber: '',
    myUserId: ''
  },
  signals: []
};
