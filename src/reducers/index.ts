import { Reducer } from 'redux';
import {
  StoreState,
  GameInfo,
  GameSpecs,
  MatchInfo,
  PhoneNumberToContact,
  UserIdsAndPhoneNumbers,
  SignalEntry,
  IdIndexer,
  MyUser,
  MatchState
} from '../types';
import { storeStateDefault } from '../stores/defaults';
import { checkCondition } from '../globals';

export interface Action {
  // Actions that start with "set" mean that they replace the matching
  // part in the store.
  // In contrast, actions that start with "update" will update mappigns
  // (using mergeMaps below).
  setGamesList?: GameInfo[];
  updateGameSpecs?: GameSpecs;
  setMatchesList?: MatchInfo[];
  updatePhoneNumberToContact?: PhoneNumberToContact;
  updateUserIdsAndPhoneNumbers?: UserIdsAndPhoneNumbers;
  setMyUser?: MyUser;
  setSignals?: SignalEntry[];
  restoreOldStore?: StoreState;
}

export function mergeMaps<T>(
  original: IdIndexer<T>,
  updateWithEntries: IdIndexer<T>
): IdIndexer<T> {
  return Object.assign(original, updateWithEntries);
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

function reduce(state: StoreState, action: Action) {
  if (undefined !== action.setGamesList) {
    return { ...state, gamesList: action.setGamesList };
  } else if (undefined !== action.restoreOldStore) {
    return action.restoreOldStore;
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
  } else if (undefined !== action.updatePhoneNumberToContact) {
    let { phoneNumberToContact, ...rest } = state;
    return {
      phoneNumberToContact: mergeMaps(
        phoneNumberToContact,
        action.updatePhoneNumberToContact
      ),
      ...rest
    };
  } else if (undefined !== action.updateUserIdsAndPhoneNumbers) {
    let { userIdsAndPhoneNumbers, ...rest } = state;
    return {
      userIdsAndPhoneNumbers: {
        phoneNumberToUserId: mergeMaps(
          userIdsAndPhoneNumbers.phoneNumberToUserId,
          action.updateUserIdsAndPhoneNumbers.phoneNumberToUserId
        ),
        userIdToPhoneNumber: mergeMaps(
          userIdsAndPhoneNumbers.userIdToPhoneNumber,
          action.updateUserIdsAndPhoneNumbers.userIdToPhoneNumber
        )
      },
      ...rest
    };
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
  const newState = reduce(state, actionWithAnyType);
  checkStoreInvariants(newState);
  return newState;
};
