import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';
import { isIos, isAndroid, checkCondition } from './globals';
import { store } from './stores/index';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { ourFirebase } from './services/firebase';
import { Contact, PhoneNumberToContact } from './types';
import * as Raven from 'raven-js';
import * as sentryRelease from './sentry-config.json';

function reactRender() {
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

console.log('Page init with parameters:', window.location.search);
ourFirebase.init();
registerServiceWorker();

if (window.location.search.match('^[?][0-9]$')) {
  const myUserIndex = Number(window.location.search.substr(1));
  // These phone numbers are also in our firebase rules (so we can do testing).
  const testUsers: Contact[] = [];
  for (let i = 0; i < 10; i++) {
    testUsers.push({
      phoneNumber: '+1111111111' + i,
      name: 'Test user ' + i
    });
  }
  // For faking our contacts on web.
  const realUsers: Contact[] = [
    {
      phoneNumber: '+19175730795',
      name: 'Yoav Zibin'
    },
    {
      phoneNumber: '+12016824408',
      name: 'Amanpreet Singh'
    },
    {
      phoneNumber: '+17326476905',
      name: 'Herbert Li'
    },
    {
      phoneNumber: '+17187107933',
      name: 'Jiaqi Zou (Angelina)'
    },
    {
      phoneNumber: '+17185525029',
      name: 'Priyanka vaidya'
    },
    {
      phoneNumber: '+12038859211',
      name: 'Radhika Mattoo'
    },
    {
      phoneNumber: '+15513586613',
      name: 'Sisi Li'
    },
    {
      phoneNumber: '+19174021465',
      name: 'Yiwei Wu'
    },
    {
      phoneNumber: '+19123456789',
      name: 'Testing SMS invite'
    }
  ];
  const myUser = testUsers[myUserIndex] || testUsers[0];
  console.log('My fake user is: ', myUser);
  ourFirebase.signInAnonymously(myUser.phoneNumber, 'Test user ' + myUserIndex);
  if (myUserIndex >= 1) {
    let currentContacts: PhoneNumberToContact = {};
    for (let contact of testUsers.concat(realUsers)) {
      currentContacts[contact.phoneNumber] = contact;
    }
    ourFirebase.storeContacts(currentContacts);
  }
}

declare global {
  interface Window {
    cordova: any;
    device: any;
    sms: any;
  }
  interface Navigator {
    contacts: any;
  }
}

function delayReactRender() {
  setTimeout(reactRender, 500);
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
if (isIos || isAndroid) {
  document.addEventListener(
    'deviceready',
    () => {
      console.log('Cordova deviceready called');
      if (isIos) {
        console.log('Loading WebRTC for iOS');
        window.cordova.plugins.iosrtc.registerGlobals();
      }
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