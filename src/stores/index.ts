import { Store, createStore, applyMiddleware, StoreEnhancer } from 'redux';
import { StoreState } from '../types';
import { reducer, Action } from '../reducers';
import { createLogger } from 'redux-logger';

const enhancer: StoreEnhancer<StoreState> | undefined =
  // I don't want to see redux state changes in tests (when window isn't defined).
  typeof window === 'undefined' ? undefined : applyMiddleware(createLogger());

export const store: Store<StoreState> = createStore(reducer, enhancer);

export function dispatch(action: Action) {
  let actionWithType: any = action;
  actionWithType.type = 'whatever';
  store.dispatch(actionWithType);
}
