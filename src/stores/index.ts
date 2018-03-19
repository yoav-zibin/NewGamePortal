import { Store, createStore, applyMiddleware, StoreEnhancer } from 'redux';
import { StoreState } from '../types';
import { reducer, Action } from '../reducers';
import { createLogger } from 'redux-logger';

const isInUnitTests = typeof window === 'undefined';
const enhancer: StoreEnhancer<StoreState> | undefined =
  // I don't want to see redux state changes in tests (when window isn't defined).
  isInUnitTests ? undefined : applyMiddleware(createLogger());

function checkIfLocalStorageWorks(): boolean {
  if (typeof window !== 'undefined' && !('localStorage' in window)) {
    return false;
  }
  try {
    localStorage.setItem('testLocalStorage', 'someTestValue');
    localStorage.removeItem('testLocalStorage');
  } catch (e) {
    // In private browsing (Safari or incognito in iOS), it throws Error: QuotaExceededError: DOM Exception 22
    return false;
  }
  return true;
}

const REDUX_STATE_LOCAL_STORAGE_KEY = 'reduxState';
const hasLocalStorage = checkIfLocalStorageWorks();

function restoreOldState() {
  let oldState: any = undefined;
  if (hasLocalStorage) {
    const oldStateStr = localStorage.getItem(REDUX_STATE_LOCAL_STORAGE_KEY);
    if (oldStateStr) {
      oldState = JSON.parse(oldStateStr);
    }
  }
  return oldState;
}

export const store: Store<StoreState> = createStore(
  reducer,
  restoreOldState(),
  enhancer
);

function persistNewState() {
  store.subscribe(() => {
    if (hasLocalStorage) {
      localStorage.setItem(
        REDUX_STATE_LOCAL_STORAGE_KEY,
        JSON.stringify(store.getState())
      );
    }
  });
}

persistNewState();

export function dispatch(action: Action) {
  let actionWithType: any = action;
  actionWithType.type = 'whatever';
  store.dispatch(actionWithType);
}
