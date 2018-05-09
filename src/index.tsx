// import { runTestsInBrowser } from './services/firebase.test';
// runTestsInBrowser();
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';
import {
  isIos,
  isAndroid,
  checkCondition,
  studentsUsers,
  isApp
} from './globals';
import { store } from './stores/index';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { ourFirebase } from './services/firebase';
import { videoChat } from './services/videoChat';
import { Contact, PhoneNumberToContact } from './types';
import * as Raven from 'raven-js';
import * as sentryRelease from './sentry-config.json';
// import { initPushNotification } from './services/pushNotification';

// We delay calling reactRender until we know if we're logged in or not
// (to avoid flashing the login screen).
let wasReactRenderCalled = false;
function reactRender() {
  // This method might be called multiple times.
  if (wasReactRenderCalled) {
    return;
  }
  wasReactRenderCalled = true;

  document.getElementById('loadingSpinner')!.style.display = 'none';
  ReactDOM.render(
    <MuiThemeProvider>
      <Provider store={store}>
        <BrowserRouter
          basename={
            location.hostname === 'yoav-zibin.github.io'
              ? '/NewGamePortal'
              : '/'
          }
        >
          <Route path="/" component={App} />
        </BrowserRouter>
      </Provider>
    </MuiThemeProvider>,
    document.getElementById('root') as HTMLElement
  );
}

const release = (sentryRelease as any).releaseVersion.trim();
console.log('Version for sentry: ', release);
Raven.config('https://efc65f7e50c14bd9a3482e2ad2ae3b9d@sentry.io/939406', {
  ignoreErrors: ['Network Error'],
  release: release
}).install();

const searchParameters = window.location.search;
console.log('Page init with parameters:', searchParameters);
ourFirebase.reactRender = reactRender;
ourFirebase.init(); // might call reactRender immediately if there is nothing in the local storage.
registerServiceWorker();

if (searchParameters.match('^[?][0-9]$')) {
  const myUserIndex = Number(searchParameters.substr(1));
  // These phone numbers are also in our firebase rules (so we can do testing).
  const testUsers: Contact[] = [];
  for (let i = 0; i < 10; i++) {
    testUsers.push({
      phoneNumber: '+1111111111' + i,
      name: 'Test user ' + i
    });
  }
  // For faking our contacts on web.
  const myUser = testUsers[myUserIndex] || testUsers[0];
  console.log('My fake user is: ', myUser);
  ourFirebase.signInAnonymously(myUser.phoneNumber, 'Test user ' + myUserIndex);
  if (myUserIndex >= 1) {
    let currentContacts: PhoneNumberToContact = {};
    for (let contact of testUsers.concat(studentsUsers)) {
      currentContacts[contact.phoneNumber] = contact;
    }
    ourFirebase.storeContacts(currentContacts);
  }
}

function delayReactRender() {
  // reactRender might also be called from ourFirebase after onAuthStateChanged is called.
  setTimeout(reactRender, 2000);
}

function createScript(id: string, src: string) {
  checkCondition('createScript', !document.getElementById(id));
  let js: HTMLScriptElement = document.createElement('script');
  js.src = src;
  js.id = id;
  js.onload = () => {
    console.log('Loaded script:', src);
  };
  js.async = true;
  let fjs = document.getElementsByTagName('script')[0];
  fjs.parentNode!.insertBefore(js, fjs);
}

// check for mobile and load cordova
if (isApp) {
  document.addEventListener(
    'deviceready',
    () => {
      console.log('Cordova deviceready called');
      if (isIos) {
        console.log('Loading WebRTC for iOS');
        window.cordova.plugins.iosrtc.registerGlobals();
        videoChat.updateIsSupported();
      }
      console.log('Push Notifications: ', window.PushNotification);
      // initPushNotification();
      const push = window.PushNotification.init({
        android: { senderID: '144595629077' },
        ios: {
          alert: 'true',
          badge: true,
          sound: 'false'
        },
        windows: {}
      });
      push.on('registration', (data: any) => {
        console.log('The phone gap reg id is ' + data.registrationId);
        if (isIos) {
          ourFirebase.addFcmToken(data.registrationId, 'ios');
        } else {
          ourFirebase.addFcmToken(data.registrationId, 'android');
        }
      });
      delayReactRender();
    },
    false
  );
}
if (isIos) {
  createScript('cordova', 'cordova/phonegapPlugins.ios.v1.min.js');
} else if (isAndroid) {
  createScript('cordova', 'cordova/phonegapPlugins.android.v1.min.js');
} else {
  delayReactRender();
}

// TODO: create a trivial site (like https://tribe.pm/) with two buttons for downloading
// the app from PlayStore / AppStore.
// TODO: create app icons and app screenshots.
// TODO: request permissions as late as possible, and the app should still be usable even without them.
