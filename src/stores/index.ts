import { Store, createStore, applyMiddleware } from 'redux';
import { StoreState } from '../types';
import { defaultState } from '../reducers';
import { createLogger } from 'redux-logger';

const loggerMiddleware = createLogger();

export const store: Store<StoreState> = createStore(
  defaultState,
  applyMiddleware(
    loggerMiddleware
  )
);
