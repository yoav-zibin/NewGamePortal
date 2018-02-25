import * as React from 'react';
import './App.css';

import AppHeader from './AppHeader';
import GamesList from './components/GamesList';

<<<<<<< HEAD
interface AppProps {
  fetchList: any;
}

class App extends React.Component<AppProps> {

  constructor(props: AppProps) {
    super(props);
  }
=======
import { connect } from 'react-redux';
import { StoreState } from './types/index';

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({
});

const GamesListContainer = connect(
  mapStateToProps,
  mapDispatchToProps)(GamesList);

class App extends React.Component {
>>>>>>> d84beb62d7e0a1b5cec3b8f1f63f8751ba7eedc8
  render() {
    return (
      <div>
        <AppHeader />
<<<<<<< HEAD
        <GamesList fetchList={this.props.fetchList} />
=======
        <GamesListContainer />
>>>>>>> d84beb62d7e0a1b5cec3b8f1f63f8751ba7eedc8
      </div>
    );
  }
}

export default App;