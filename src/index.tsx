import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';

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
            location.hostname === 'yoav-zibin.github.io' ? 'NewGamePortal' : '/'
          }
        >
          <div>
            <Route path="/" component={App} />
          </div>
        </BrowserRouter>
      </Provider>
    </MuiThemeProvider>,
    document.getElementById('root') as HTMLElement
  );
}

const release = (sentryRelease as any).releaseVersion.trim();
console.log('Version for sentry: ', release);
Raven.config('https://efc65f7e50c14bd9a3482e2ad2ae3b9d@sentry.io/939406', {
  ignoreErrors: [
    'Network Error',
  ],
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
    }
  ];
  const myUser = testUsers[myUserIndex] || testUsers[0];
  console.log('My fake user is: ', myUser);
  ourFirebase.signInAnonymously(myUser.phoneNumber);

  let currentContacts: PhoneNumberToContact = {};
  for (let contact of testUsers.concat(realUsers)) {
    currentContacts[contact.phoneNumber] = contact;
  }
  ourFirebase.storeContacts(currentContacts);
}

// Give 500ms for onAuthStateChanged in firebase.ts to load the cookies and log in the user
// (so we won't see the login screen flashed and redirect to '/')
setTimeout(reactRender, 500);
