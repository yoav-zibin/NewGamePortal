import * as React from 'react';
import './App.css';

import AppHeader from './AppHeader';
import GamesList from './GamesList';

import { connect } from 'react-redux';
import { StoreState } from './types/index';

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

const GamesListContainer = connect(mapStateToProps, mapDispatchToProps)(
  GamesList
);

class App extends React.Component {
  render() {
    return (
      <div>
        <AppHeader />
        <GamesListContainer />
      </div>
    );
  }
}

export default App;
