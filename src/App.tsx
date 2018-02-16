import * as React from 'react';
import './App.css';

import AppHeader from './AppHeader';
import GamesList from './GamesList';

class App extends React.Component {
  render() {
    return (
      <div>
        <AppHeader />
        <GamesList />
      </div>
    );
  }
}

export default App;
