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
  isApp,
  setLoadingSpinnerVisible
} from './globals';
import { store } from './stores/index';
import App from './App';
import './index.css';
import { ourFirebase } from './services/firebase';
import { videoChat } from './services/videoChat';
import { Contact, PhoneNumberToContact } from './types';
import * as Raven from 'raven-js';
import * as sentryRelease from './sentry-config.json';

// Service worker is useful for caching the static resources, i.e., react generates service-worker.js with:
// var precacheConfig=[["/NewGamePortal/index.html","43da4505e69af8c53fff6b8c443e1fb6"],["/NewGamePortal/static/css/
import registerServiceWorker from './registerServiceWorker';

// No need for web push notifications.
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

  setLoadingSpinnerVisible(false);
  ReactDOM.render(
    <MuiThemeProvider>
      <Provider store={store}>
        <BrowserRouter
          basename={
            location.hostname === 'yoav-zibin.github.io' || location.hostname.endsWith('zibiga.com')
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
function getLogger(msg: string) {
  return function() {
    console.log(msg, arguments);
  };
}
function onDeviceReady() {
  console.log('Cordova deviceready called');
  if (isIos) {
    console.log('Loading WebRTC for iOS');
    window.cordova.plugins.iosrtc.registerGlobals();
    videoChat.updateIsSupported();
  }
  console.log('Push Notifications: ', window.PushNotification);
  const push = window.PushNotification.init({
    android: {
      senderID: '144595629077',
      clearBadge: true,
      clearNotifications: true
      // sound & vibrate are true by default
    },
    ios: {
      alert: true,
      badge: true,
      sound: true,
      clearBadge: true
    },
    windows: {}
  });
  push.on('registration', (data: any) => {
    console.log('The phone gap reg id is ', data.registrationId);
    ourFirebase.addFcmToken(data.registrationId, isIos ? 'ios' : 'android');
  });
  push.on('notification', (data: any) => {
    console.log('PushNotification notification:', data);
    // TODO(Priyanka): show a message that when the user clicks on it will open the correct match.
    // E.g., you can use a http://www.material-ui.com/#/components/snackbar
    // You can put the data you need in our store (by dispatching an action),
    // and have the AppHeader show the snackbar accordingly
    // (e.g., if we're already in that match, then no need to do anything).

    // Note that there are 3 types of notifications: coldstart, background, and foreground.
    // (Look at data.additionalData.foreground and data.additionalData.coldstart)
    // From a coldstart or background (when the user already saw the notification), then
    // you don't need to show anything and you can just navigate to the match (if you're not in it already).
    // From foreground, you should show the snackbar, and let the user decide whether they want to click on it.
  });
  push.on('error', getLogger('PushNotification error:'));
  // Clear all push message notifications when app is openen.
  // iOS does that automatically, but android doesn't.
  if (push.clearAllNotifications) {
    // it was added in later versions.
    try {
      push.clearAllNotifications(
        getLogger('clearAllNotifications done'),
        getLogger('clearAllNotifications error')
      );
    } catch (e) {
      /*
      I once got on Android 4.4.4: 
      ReferenceError: NPObject deleted
        at getNativeApiProvider (https://learninggames.club/?phonegapPlugins=v105:3:9247)
        at androidExec (https://learninggames.club/?phonegapPlugins=v105:3:9919)
        at e.clearAllNotifications (https://learninggames.club/?phonegapPlugins=v105:4:6161)
      */
      console.error('clearAllNotifications:', e);
    }
  }

  delayReactRender();
}

// check for mobile and load cordova
if (isApp) {
  document.addEventListener('deviceready', onDeviceReady, false);
}
if (isIos) {
  createScript('cordova', 'cordova/phonegapPlugins.ios.v1.min.js');
} else if (isAndroid) {
  createScript('cordova', 'cordova/phonegapPlugins.android.v1.min.js');
} else {
  delayReactRender();
}
