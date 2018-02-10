import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import MyGames from './MyGames';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

ReactDOM.render(
  <MuiThemeProvider>
    <MyGames />
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
