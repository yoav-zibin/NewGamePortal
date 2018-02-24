import { Reducer } from 'redux';

/**
 * Combines multiple reducers into a single reducer.
 * @param reducers Array of reducers which will called one by one
 */
export function reduceReducers(...reducers: Reducer<any>[]) {
  // previous is current state, current is action
  return (previous: any, current: any) =>
    reducers.reduce(
      (p, r) => r(p, current),
      previous
    );
}
