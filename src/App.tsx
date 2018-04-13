import * as React from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
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
        <Route path="/" component={AppHeader} />
        <Route exact={true} path="/login" component={Login} />
        <PrivateRoute
          exact={true}
          path="/matches/:matchIdInRoute"
          component={PlayingScreen}
        />
        <PrivateRoute exact={true} path="/" component={MatchesList} />
        <PrivateRoute exact={true} path="/addMatch" component={AddMatch} />
        <PrivateRoute
          exact={true}
          path="/contactsList/:matchIdInRoute"
          component={ContactsList}
        />
      </div>
    );
  }
}

export default App;
