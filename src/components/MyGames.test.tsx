import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MatchesList from './MatchesList';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <MuiThemeProvider>
      <MatchesList />
    </MuiThemeProvider>,
    div
  );
});
