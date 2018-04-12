import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MatchesList from './MatchesList';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { store } from '../stores';
import { BrowserRouter as Router } from 'react-router-dom';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <MuiThemeProvider>
      <Provider store={store}>
        <Router>
          <MatchesList />
        </Router>
      </Provider>
    </MuiThemeProvider>,
    div
  );
});
