import { combineReducers } from 'redux';
import { StoreState, GameInfo, MatchInfo, Contact, PhoneNumberToUserId, SignalEntry } from '../types';
import { storeStateDefault } from '../stores/defaults';
import { reduceReducers } from '../utils/general';

interface Action {
  setGamesList?: GameInfo[];
  setGameSpec?: GameInfo;
  setMatchesList?: MatchInfo[];
  setMatch?: MatchInfo;
  setCurrentMatchIndex?: number; // an index in matchesList
  setContacts?: Contact[];
  setPhoneNumberToUserId?: PhoneNumberToUserId; // Updates both phoneNumberToUserId and userIdToPhoneNumber.
  setMyUserId?: string;
  setSignals?: SignalEntry[];
  // TODO: add more.
}

function setGamesListReducer(state: GameInfo[] = storeStateDefault['gamesList'],
                             actionWithAnyType: any) {
  const action: Action = actionWithAnyType;
  if (action.setGamesList) {
    return action.setGamesList;
  } else {
    return state;
  }
}

// Combine all the reducers that work on gamesList part
// of store state here. This will return a single reducer
const gameListReducers = reduceReducers(
  setGamesListReducer
);

export const defaultState = combineReducers<StoreState>({
  // The reducers which work on a particular part of
  // attribute should be clubbed together using reduceReducers
  gamesList: gameListReducers
});
