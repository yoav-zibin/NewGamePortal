import { Reducer } from 'redux';
import { StoreState, GameInfo, MatchInfo, Contact, User } from '../types';
import { storeStateDefault } from '../stores/defaults';

interface Action {
  setGamesList?: GameInfo[];
  addMatch?: MatchInfo;
  setMatchesList?: MatchInfo[];
  setCurrentMatchIndex?: number; // an index in matchesList
  setContacts?: Contact[];
  setUsers?: User[];
  setMyUserId?: string;
}

export const reducer: Reducer<StoreState> = 
  (state: StoreState = storeStateDefault, actionWithAnyType: any) => {
    const action: Action = actionWithAnyType;
    if (action.setGamesList) {
      let {gamesList, ...rest} = state;
      return {gamesList: action.setGamesList, ...rest};
    } else {
      return state;
    }
};
