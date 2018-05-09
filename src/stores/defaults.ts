import { StoreState, UserIdToInfo } from '../types';
import { studentsUsers, deepFreeze } from '../globals';

const userIdToInfo: UserIdToInfo = {};
for (let student of studentsUsers) {
  userIdToInfo[student.userId] = {
    displayName: student.name + ' (Mentor)',
    phoneNumber: student.phoneNumber,
    userId: student.userId
  };
}

export const storeStateDefault: StoreState = {
  gamesList: [],
  gameSpecs: {
    imageIdToImage: {},
    elementIdToElement: {},
    gameSpecIdToGameSpec: {}
  },
  matchesList: [],
  userIdToInfo: userIdToInfo,
  phoneNumberToContact: {},
  myUser: {
    myName: '',
    myPhoneNumber: '',
    myCountryCode: 'US',
    myUserId: ''
  },
  signals: [],
  audioMute: false
};
deepFreeze(storeStateDefault);
