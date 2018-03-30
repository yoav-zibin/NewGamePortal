import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';

import { store } from './stores/index';
import App from './App';
import ContactsList from './components/ContactsList';
import PlayingScreen from './components/PlayingScreen';
import MatchesList from './components/MatchesList';
import AddMatch from './components/AddMatch';
import registerServiceWorker from './registerServiceWorker';
import Login from './components/Login';
import './index.css';
import Board from './components/Board';
import { ourFirebase } from './services/firebase';
import { Contact, PhoneNumberToContact } from './types';

document.getElementById('loadingSpinner')!.style.display = 'none';

// TODO: delete once we have phone-number login.
const testUsers: Contact[] = [
  {
    phoneNumber: '9175730795',
    name: 'Yoav Zibin'
  },
  {
    phoneNumber: '2016824408',
    name: 'Amanpreet Singh'
  },
  {
    phoneNumber: '7326476905',
    name: 'Herbert Li'
  },
  {
    phoneNumber: '7187107933',
    name: 'Jiaqi Zou (Angelina)'
  },
  {
    phoneNumber: '7185525029',
    name: 'Priyanka vaidya'
  },
  {
    phoneNumber: '2038859211',
    name: 'Radhika Mattoo'
  },
  {
    phoneNumber: '5513586613',
    name: 'Sisi Li'
  },
  {
    phoneNumber: '9174021465',
    name: 'Yiwei Wu'
  }
];
ourFirebase.allPromisesForTests = [];
ourFirebase.init();
const myUserIndex = window.location.search
  ? Number(window.location.search.substr(1))
  : 0;
const myUser = testUsers[myUserIndex] || testUsers[0];
ourFirebase.signInAnonymously(myUser.phoneNumber).then(() => {
  const userId = ourFirebase.getUserId();
  console.warn('Signed in anonymously, userId=', userId);
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
          <Route path="/" component={App} exact={true} />
          <Route path="/match/:matchId" component={PlayingScreen} />
          <Route path="/board" component={Board} />
          <Route path="/myMatches" component={MatchesList} />
          <Route path="/addMatch" component={AddMatch} />
          <Route path="/addComponent" component={ContactsList} />
          <Route path="/login" component={Login} />
        </div>
      </BrowserRouter>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
