/**
 * @jest-environment node
 */
import { ourFirebase } from './firebase';

ourFirebase.init();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

it('can sign in anon', (done) => {
  ourFirebase.signInAnonymously().then(()=>{
    done();
  }).catch((err)=>{
    console.error('error in signInAnonymously with err=', err);
    throw new Error('error in signInAnonymously err=' + err);
  });
});