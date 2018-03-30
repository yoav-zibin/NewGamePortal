import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MatchesList from './MatchesList';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from 'react-redux';
import { store } from '../stores';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <MuiThemeProvider>
      <Provider store={store}>
        <MatchesList />
      </Provider>
    </MuiThemeProvider>,
    div
  );
});
