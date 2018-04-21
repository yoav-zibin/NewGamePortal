import { StoreState } from '../types';

export const storeStateDefault: StoreState = {
  gamesList: [],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  gotContactsPermission: false,
  phoneNumberToContact: {},
  userIdsAndPhoneNumbers: {
    phoneNumberToUserId: {},
    userIdToPhoneNumber: {}
  },
  myUser: {
    myName: '',
    myPhoneNumber: '',
    myCountryCode: '',
    myUserId: ''
  },
  signals: []
};
