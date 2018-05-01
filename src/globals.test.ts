
import { deepCopy, deepFreeze } from './globals';

it('Freezing an object with a cycle should throw an exception', () => {
  const obj = {k: 42};
  obj.k = <any> obj;
  expect(() => deepFreeze(obj)).toThrow();
});

it('Frozen objects should throw an exception', () => {
  const obj = {k: 42};
  deepFreeze(obj);
  expect(() => obj.k = 43).toThrow();
  const copy = deepCopy(obj);
  copy.k = 43;
});

it('Frozen arrays should throw an exception', () => {
  const obj = deepFreeze([{k: 42}]);
  expect(() => obj[0].k = 43).toThrow();
  expect(() => obj[0] = {k: 44}).toThrow();
  const copy = deepCopy(obj);
  copy[0].k = 43;
  copy[0] = {k: 44};
});