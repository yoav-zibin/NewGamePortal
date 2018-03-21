import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';

import { store } from './stores/index';
import App from './App';
import PlayingScreenContainer from './containers/PlayingScreenContainer';
import Board from './components/Board';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

// TODO: In basename, add support for gh-pages baseURL
// Either use config for that or use location href to decide
ReactDOM.render(
  <MuiThemeProvider>
    <Provider store={store}>
      <BrowserRouter basename="/">
        <div>
          <Route path="/" component={App} exact={true} />
          <Route path="/match/:matchId" component={PlayingScreenContainer} />
          <Route path="/board" component={Board} />
        </div>
      </BrowserRouter>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
