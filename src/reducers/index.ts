import { Reducer } from 'redux';
import { StoreState, GameInfo } from '../types';
import { storeStateDefault } from '../stores/defaults';

export const reducer: Reducer<StoreState> = 
  (state: StoreState = storeStateDefault, action: any) => {
  if (action.type === 'SET_GAMES_LIST') {
    let newGameList: GameInfo[] = action.gamesList;
    let {gamesList, ...rest} = state;
    return {gamesList: newGameList, ...rest};
  } else {
    return state;
  }
};
