import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';

import { store } from './stores/index';
import App from './App';
import ContactsList from './components/ContactsList';
import PlayingScreen from './components/PlayingScreen';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
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
          <Route path="/App" component={App} />
          <Route path="/AddComponent" component={ContactsList} />

          <Route path="/match/:matchId" component={PlayingScreen} />
        </div>
      </BrowserRouter>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
