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

document.getElementById('loadingSpinner')!.style.display = 'none';

// TODO: delete once we have phone-number login.
// These phone numbers are also in our firebase rules (so we can do testing).
const testUsers: Contact[] = [
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
ourFirebase.allPromisesForTests = [];
ourFirebase.init();
const myUserIndex = window.location.search
  ? Number(window.location.search.substr(1))
  : 0;
const myUser = testUsers[myUserIndex] || testUsers[0];
console.log('My fake user is: ', myUser);
ourFirebase.signInAnonymously(myUser.phoneNumber).then(() => {
  const userId = ourFirebase.getUserId();
  console.warn('Signed in anonymously, userId=', userId, ' myUser=', myUser);
  let currentContacts: PhoneNumberToContact = {};
  for (let contact of testUsers) {
    currentContacts[contact.phoneNumber] = contact;
  }
  ourFirebase.storeContacts(currentContacts);
});

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
registerServiceWorker();
