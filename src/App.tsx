import * as React from 'react';
import './App.css';
import AppHeader from './AppHeader';
import { Route } from 'react-router';
import PrivateRoute from './components/PrivateRoute';
import PlayingScreen from './components/PlayingScreen';
import MatchesList from './components/MatchesList';
import AddMatch from './components/AddMatch';
import ContactsList from './components/ContactsList';
import Login from './components/Login';

class App extends React.Component {
  render() {
    return (
      <div>
        <AppHeader />
        <Route exact={true} path="/login" component={Login} />
        <PrivateRoute
          exact={true}
          path="/matches/:matchId"
          component={PlayingScreen}
        />
        <PrivateRoute exact={true} path="/" component={MatchesList} />
        <PrivateRoute exact={true} path="/addMatch" component={AddMatch} />
        <PrivateRoute
          exact={true}
          path="/contactsList/:matchId"
          component={ContactsList}
        />
      </div>
    );
  }
}

export default App;
