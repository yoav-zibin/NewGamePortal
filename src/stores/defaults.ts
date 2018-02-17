import { StoreState } from '../types';

export const storeStateDefault: StoreState = {
  games: {
    current: {
      info: {
        boardImage: '',
        pieces: []
      }
    },
    list: []
  }
};
