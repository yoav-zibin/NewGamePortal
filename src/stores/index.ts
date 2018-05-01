import { Store, createStore, applyMiddleware, StoreEnhancer } from 'redux';
import { StoreState } from '../types';
import { reducer, Action } from '../reducers';
import { createLogger } from 'redux-logger';
import { storeStateDefault } from './defaults';
import { deepCopy } from '../globals';

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

function restoreOldState(): StoreState | undefined {
  let oldState: StoreState | undefined = undefined;
  if (hasLocalStorage) {
    const oldStateStr = localStorage.getItem(REDUX_STATE_LOCAL_STORAGE_KEY);
    if (oldStateStr) {
      oldState = JSON.parse(oldStateStr);
    }
  }
  return oldState;
}

export const persistedOldStore: StoreState | undefined = restoreOldState();
export const store: Store<StoreState> = createStore(
  reducer,
  <any>undefined,
  enhancer
);

function saveStateInLocalStorage(state: StoreState) {
  localStorage.setItem(REDUX_STATE_LOCAL_STORAGE_KEY, JSON.stringify(state));
}

// trimState reduces the state so we can save it in localStorage.
// It's exported so we can write unit tests.
export function trimState(state: StoreState): StoreState {
  // If there any game specs that aren't used in any matches, delete them and return.
  if (Object.keys(state.gameSpecs.gameSpecIdToGameSpec).length > 0) {
    let gameSpecsToDelete = [];
    for (let specId of Object.keys(state.gameSpecs.gameSpecIdToGameSpec)) {
      let specIdInMatch = state.matchesList.find( m => m.gameSpecId === specId);
      if (!specIdInMatch) {
        gameSpecsToDelete.push(specId);
      }
    }
    if (gameSpecsToDelete.length > 0) {
      // todo: use the correct loops.
      for (let i = 0; i < gameSpecsToDelete.length; i++) {
        let specId = gameSpecsToDelete[i];
        delete state.gameSpecs.gameSpecIdToGameSpec[specId];
      }
      return state;
    }
  }
  // If there are matches, delete the match that has the oldest lastUpdatedOn and return.
  if (state.matchesList.length > 0) {
    let oldestIndex = 0;
    let oldestTimestamp = state.matchesList[oldestIndex].lastUpdatedOn;
    // todo: use reduce 
    for (let i = 1; i < state.matchesList.length; i++) {
      let timestamp = state.matchesList[i].lastUpdatedOn;
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
        oldestIndex = i;
      }
    }
    // delete state.matchesList[oldestIndex];
    state.matchesList.splice(oldestIndex, 1);
    return state;
  }
  if (Object.keys(state.phoneNumberToContact).length > 0) {
    state.phoneNumberToContact = {};
    return state;
  }
  // (otherwise) just return myUser.
  return { ...storeStateDefault, myUser: state.myUser };
}

function persistNewState() {
  store.subscribe(() => {
    if (hasLocalStorage) {
      let state = store.getState();
      try {
        saveStateInLocalStorage(state);
        return;
      } catch (e) {
        // If we store too much data, we may get
        // QuotaExceededError: The quota has been exceeded.
        state = deepCopy(state);
        for (let i = 0; i < 100; i++) {
          try {
            state = trimState(state);
            saveStateInLocalStorage(state);
            return;
          } catch (e) {
            // try again.
          }
        }
      }
    }
  });
}

persistNewState();

export function dispatch(action: Action) {
  let actionWithType: any = action;
  actionWithType.type = 'whatever';
  store.dispatch(actionWithType);
}
