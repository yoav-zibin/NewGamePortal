import { StoreState } from '../types';

export const storeStateDefault: StoreState = {
  gamesList: [],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  phoneNumberToContact: {},
  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {},
    userIdToPhoneNumber: {}
  },
  myUser: {
    myPhoneNumber: '',
    myCountryCode: '',
    myUserId: ''
  },
  signals: []
};
