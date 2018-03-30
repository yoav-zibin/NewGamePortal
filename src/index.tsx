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
import AddMatch from './components/AddMatch';
import registerServiceWorker from './registerServiceWorker';
import Login from './components/Login';
import './index.css';
import Board from './components/Board';
import { ourFirebase } from './services/firebase';
import { MatchStateHelper } from './services/matchStateHelper';

document.getElementById('loadingSpinner')!.style.display = 'none';

// TODO: delete once we have phone-number login.
ourFirebase.allPromisesForTests = [];
ourFirebase.init();
ourFirebase.signInAnonymously().then(() => {
  const userId = ourFirebase.getUserId();
  console.warn('Signed in anonymously, userId=', userId);
  Promise.all(ourFirebase.allPromisesForTests!).then(() => {
    const gameInfo = store
      .getState()
      .gamesList.find(gameInList => gameInList.gameName === 'Chess')!;
    ourFirebase.fetchGameSpec(gameInfo);
    Promise.all(ourFirebase.allPromisesForTests!).then(() => {
      if (store.getState().matchesList.length === 0) {
        const gameSpec = store.getState().gameSpecs.gameSpecIdToGameSpec[
          gameInfo.gameSpecId
        ];
        const initialState = MatchStateHelper.createInitialState(gameSpec);
        ourFirebase.createMatch(gameInfo, initialState);
      }
      dispatch({ setCurrentMatchIndex: 0 });
    });
  });
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
