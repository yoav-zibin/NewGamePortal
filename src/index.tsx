import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';

import { store, dispatch } from './stores/index';
import App from './App';
import ContactsList from './components/ContactsList';
import PlayingScreen from './components/PlayingScreen';
import MatchesList from './components/MatchesList';
import AddMatches from './components/AddMatches';
import registerServiceWorker from './registerServiceWorker';
import Login from './components/Login';
import './index.css';
import Board from './components/Board';
import { ourFirebase } from './services/firebase';
import { MatchStateHelper } from './services/matchStateHelper';
import { Contact } from './types';

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
ourFirebase.signInAnonymously().then(() => {
  const userId = ourFirebase.getUserId();
  console.warn('Signed in anonymously, userId=', userId);
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
          <Route path="/addMatches" component={AddMatches} />
          <Route path="/addComponent" component={ContactsList} />
          <Route path="/login" component={Login} />
        </div>
      </BrowserRouter>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
