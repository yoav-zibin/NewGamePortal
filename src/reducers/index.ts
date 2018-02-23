import { Reducer } from 'redux';
import { StoreState } from '../types';
import { storeStateDefault } from '../stores/defaults';

export const reducer: Reducer<StoreState> = 
  (state: StoreState = storeStateDefault, action: any) => {
  if (action.type === 'SOME_PARTICULAR_TYPE_HERE') {
    return state;
  } else {
    return state;
  }
};
