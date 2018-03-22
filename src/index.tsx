import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { Route, BrowserRouter } from 'react-router-dom';
import ViewMatches from './components/ViewMatches';
import QueryMatches from './components/QueryMatches';
// import PrivateRoute from './components/PrivateRoute';

import { store } from './stores/index';
import App from './App';
import ContactsList from './components/ContactsList';
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
          <Route path="/" component={App} />
          <Route exact={true} path="/update" component={ViewMatches} />
          <Route exact={true} path="/create" component={QueryMatches} />
          <Route path="/addComponent" component={ContactsList} />
        </div>
      </BrowserRouter>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
