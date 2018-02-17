import { combineReducers } from 'redux';
import { StoreState } from '../types';
import { storeStateDefault } from '../stores/defaults';

function exampleReducer(state: StoreState=storeStateDefault, action: any) {
  if (action.type === 'SOME_PARTICULAR_TYPE_HERE') {
    return state;
  } else {
    return state;
  }
}

export const defaultState = combineReducers<StoreState>({
  exampleReducer
});
