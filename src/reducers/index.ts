import { Reducer } from 'redux';
import {
  StoreState,
  GameInfo,
  GameSpecs,
  MatchInfo,
  PhoneNumberToContact,
  UserIdsAndPhoneNumbers,
  MatchIdToMatchState,
  SignalEntry,
  IdIndexer,
  MyUser
} from '../types';
import { storeStateDefault } from '../stores/defaults';

export interface Action {
  // Actions that start with "set" mean that they replace the matching
  // part in the store.
  // In contrast, actions that start with "update" will update mappigns
  // (using mergeMaps below).
  setGamesList?: GameInfo[];
  updateGameSpecs?: GameSpecs;
  setMatchesList?: MatchInfo[];
  setCurrentMatchIndex?: number; // an index in matchesList
  updateMatchIdToMatchState?: MatchIdToMatchState;
  updatePhoneNumberToContact?: PhoneNumberToContact;
  updateUserIdsAndPhoneNumbers?: UserIdsAndPhoneNumbers;
  setMyUser?: MyUser;
  setSignals?: SignalEntry[];
}

export function mergeMaps<T>(
  original: IdIndexer<T>,
  updateWithEntries: IdIndexer<T>
): IdIndexer<T> {
  return Object.assign(original, updateWithEntries);
}

function checkCondition(desc: string, cond: boolean) {
  if (!cond) {
    throw new Error('Condition check failed for: ' + desc);
  }
}

function checkStoreInvariants(state: StoreState) {
  // TODO: check invariants, e.g.,
  // that every Image object in the store (except screenshots) is also present in
  // store.gameSpecs.imageIdToImage.
  // Ensure UserIdsAndPhoneNumbers have two mappings that are exactly the reverse of each other.
  checkCondition(
    'currentMatchIndex is in range',
    state.currentMatchIndex >= -1 &&
      state.currentMatchIndex <= state.matchesList.length
  );
}

function reduce(state: StoreState, action: Action) {
  if (action.setGamesList) {
    return { ...state, gamesList: action.setGamesList };
  } else if (action.setMatchesList) {
    return { ...state, matchesList: action.setMatchesList };
  } else if (action.setSignals) {
    return { ...state, signals: action.setSignals };
  } else if (action.setMyUser) {
    return { ...state, myUser: action.setMyUser };
    // TODO: support all other reducers.
  } else if (action.updatePhoneNumberToContact) {
    let { phoneNumberToContact, ...rest } = state;
    return {
      phoneNumberToContact: mergeMaps(
        phoneNumberToContact,
        action.updatePhoneNumberToContact
      ),
      ...rest
    };
  } else if (action.setCurrentMatchIndex) {
    return { ...state, currentMatchIndex: action.setCurrentMatchIndex };
  } else if (action.updateGameSpecs) {
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
