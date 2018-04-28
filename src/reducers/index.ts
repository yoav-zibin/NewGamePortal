import { Reducer } from 'redux';
import {
  StoreState,
  GameInfo,
  GameSpecs,
  MatchInfo,
  PhoneNumberToContact,
  SignalEntry,
  IdIndexer,
  MyUser,
  MatchState,
  UserIdToInfo
} from '../types';
import { storeStateDefault } from '../stores/defaults';
import { checkCondition, getPhoneNumberToUserInfo, deepFreeze, shallowCopy } from '../globals';

export interface Action {
  // Actions that start with "set" mean that they replace the matching
  // part in the store.
  // In contrast, actions that start with "update" will update mappigns
  // (using mergeMaps below).
  setGamesList?: GameInfo[];
  updateGameSpecs?: GameSpecs;
  setMatchesList?: MatchInfo[];
  updatePhoneNumberToContact?: PhoneNumberToContact;
  updateUserIdToInfo?: UserIdToInfo;
  setMyUser?: MyUser;
  setSignals?: SignalEntry[];
  restoreOldStore?: StoreState;
}

export function mergeMaps<T>(
  original: IdIndexer<T>,
  updateWithEntries: IdIndexer<T>
): IdIndexer<T> {
  const copy = shallowCopy(original);
  return Object.assign(copy, updateWithEntries);
}

export function checkMatchStateInStore(
  matchState: MatchState,
  gameSpecId: string,
  state: StoreState
) {
  // We load the matches, and then we load their game specs, so it's possible we don't have a spec yet.
  const spec = state.gameSpecs.gameSpecIdToGameSpec[gameSpecId];
  checkCondition(
    '#pieces',
    matchState.length === 0 || !spec || matchState.length === spec.pieces.length
  );
}

function checkStoreInvariants(state: StoreState) {
  state.matchesList.forEach(match => {
    checkCondition(
      'I play in match',
      match.participantsUserIds.indexOf(state.myUser.myUserId) !== -1
    );
    checkMatchStateInStore(match.matchState, match.gameSpecId, state);
  });
}

function setNamesFromContacts(state: StoreState): StoreState {
  const { phoneNumberToContact, userIdToInfo } = state;
  const phoneNumberToUserInfo = getPhoneNumberToUserInfo(userIdToInfo);
  const newUserIdToInfo: UserIdToInfo = {};
  for (let [phoneNumber, contact] of Object.entries(phoneNumberToContact)) {
    const userInfo = phoneNumberToUserInfo[phoneNumber];
    if (userInfo && userInfo.displayName !== contact.name) {
      newUserIdToInfo[userInfo.userId] = {
        displayName: contact.name,
        userId: userInfo.userId,
        phoneNumber: phoneNumber
      };
    }
  }
  return {
    ...state,
    userIdToInfo: mergeMaps(userIdToInfo, newUserIdToInfo)
  };
}

function fixOldState(oldSavedState: StoreState) {
  // I've added userIdToInfo, so it might not be in state stored in localStorage.
  if (!oldSavedState.userIdToInfo) {
    oldSavedState.userIdToInfo = {};
  }
  return oldSavedState;
}

function reduce(state: StoreState, action: Action) {
  if (undefined !== action.setGamesList) {
    return { ...state, gamesList: action.setGamesList };
  } else if (undefined !== action.restoreOldStore) {
    return fixOldState(action.restoreOldStore);
  } else if (undefined !== action.setMatchesList) {
    let { matchesList, ...rest } = state;
    return {
      ...rest,
      matchesList: action.setMatchesList
    };
  } else if (undefined !== action.setSignals) {
    return { ...state, signals: action.setSignals };
  } else if (undefined !== action.setMyUser) {
    return { ...state, myUser: action.setMyUser };
  } else if (undefined !== action.updateUserIdToInfo) {
    let { userIdToInfo, ...rest } = state;
    return setNamesFromContacts({
      userIdToInfo: mergeMaps(userIdToInfo, action.updateUserIdToInfo),
      ...rest
    });
  } else if (undefined !== action.updatePhoneNumberToContact) {
    const { phoneNumberToContact, ...rest } = state;
    const newPhoneNumberToContact = action.updatePhoneNumberToContact;
    return setNamesFromContacts({
      phoneNumberToContact: mergeMaps(
        phoneNumberToContact,
        newPhoneNumberToContact
      ),
      ...rest
    });
  } else if (undefined !== action.updateGameSpecs) {
    let {
      imageIdToImage,
      elementIdToElement,
      gameSpecIdToGameSpec
    } = action.updateGameSpecs;
    let { gameSpecs, ...rest } = state;
    return {
      gameSpecs: {
        imageIdToImage: mergeMaps(gameSpecs.imageIdToImage, imageIdToImage),
        elementIdToElement: mergeMaps(
          gameSpecs.elementIdToElement,
          elementIdToElement
        ),
        gameSpecIdToGameSpec: mergeMaps(
          gameSpecs.gameSpecIdToGameSpec,
          gameSpecIdToGameSpec
        )
      },
      ...rest
    };
  } else {
    return state;
  }
}

export const reducer: Reducer<StoreState> = (
  state: StoreState = storeStateDefault,
  actionWithAnyType: any
) => {
  checkStoreInvariants(state);
  const newState = deepFreeze(reduce(state, actionWithAnyType));
  checkStoreInvariants(newState);
  return newState;
};
