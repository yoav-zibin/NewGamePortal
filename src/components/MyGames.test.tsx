import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ViewMatches from './ViewMatches';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <MuiThemeProvider>
      <ViewMatches />
    </MuiThemeProvider>,
    div
  );
});
