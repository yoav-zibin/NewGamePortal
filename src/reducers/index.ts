import { Reducer } from 'redux';
import {
  StoreState, GameInfo, GameSpecs, MatchInfo, Contact,
  PhoneNumberToUserId, MatchIdToMatchState, SignalEntry,
  IdIndexer
} from '../types';
import { storeStateDefault } from '../stores/defaults';

interface Action {
  setGamesList?: GameInfo[];
  updateGameSpecs?: GameSpecs;
  setMatchesList?: MatchInfo[];
  setCurrentMatchIndex?: number; // an index in matchesList
  updateMatchStates?: MatchIdToMatchState;
  setContacts?: Contact[];
  updatePhoneNumberToUserId?: PhoneNumberToUserId; // Updates both phoneNumberToUserId and userIdToPhoneNumber.  
  setMyUserId?: string;
  setSignals?: SignalEntry[];
}

function mergeMaps<T>(
  original: IdIndexer<T>, 
  updateWithEntries: IdIndexer<T>): IdIndexer<T> {
  return Object.assign(original, updateWithEntries);
}

export const reducer: Reducer<StoreState> =
  (state: StoreState = storeStateDefault, actionWithAnyType: any) => {
    const action: Action = actionWithAnyType;
    if (action.setGamesList) {
      let { gamesList, ...rest } = state;
      return { gamesList: action.setGamesList, ...rest };
    } else if (action.updateGameSpecs) {
      let {imageIdToImage, elementIdToElement, gameSpecIdToGameSpec} = action.updateGameSpecs;
      let { gameSpecs, ...rest } = state;
      return { gameSpecs: {
          imageIdToImage: mergeMaps(gameSpecs.imageIdToImage, imageIdToImage), 
          elementIdToElement: mergeMaps(gameSpecs.elementIdToElement, elementIdToElement), 
          gameSpecIdToGameSpec: mergeMaps(gameSpecs.gameSpecIdToGameSpec, gameSpecIdToGameSpec), 
        }, ...rest };
    } else {
      return state;
    }
  };
