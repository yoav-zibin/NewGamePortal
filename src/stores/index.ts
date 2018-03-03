import { Store, createStore, applyMiddleware } from 'redux';
import { StoreState } from '../types';
import { reducer, Action } from '../reducers';
import { createLogger } from 'redux-logger';

const loggerMiddleware = createLogger();

export const store: Store<StoreState> = createStore(
  reducer,
  applyMiddleware(loggerMiddleware)
);

export function dispatch(action: Action) {
  store.dispatch(<any> action);
}