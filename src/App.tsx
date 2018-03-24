import * as React from 'react';
import './App.css';

import AppHeader from './AppHeader';
import GamesList from './components/GamesList';

// TODO: Use private route component to display games list only when you
// logged in
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
