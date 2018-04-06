import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer } from './types';

class AppHeader extends React.Component {
  routes: StringIndexer = {
    '/login': 'Login',
    '/contactsList': 'Contacts',
    '/addMatch': 'Create a new Match',
    '/myMatches': 'Matches',
    '/PlayingScreen': 'Playing Screen'
  };

  // Header for AppBar
  getLocation = () => {
    let pathname: string = window.location.pathname;
    let result = this.routes[pathname];
    if (result) {
      return result;
    } else if (pathname.startsWith('/matches/')) {
      // On specific match page, render match ID
      let matchId = pathname.split('/')[2];
      return 'Match ' + matchId;
    } else {
      return '';
    }
  };

  // When back button is clicked
  handleOnClick = () => {
    window.history.go(-1);
  };

  render() {
    return (
      <AppBar
        iconElementLeft={
          <FloatingActionButton mini={true} onClick={this.handleOnClick}>
            <NavigationArrowBack />
          </FloatingActionButton>
        }
        title={this.getLocation()}
        iconClassNameRight="muidocs-icon-navigation-expand-more"
      />
    );
  }
}

export default AppHeader;

{
  /* <Route exact={true} path="/PlayingScreen" component={PlayingScreen} />
<Route exact={true} path="/matches/:matchId" component={Board} />
<Route exact={true} path="/myMatches" component={MatchesList} />
<Route exact={true} path="/addMatch" component={AddMatch} />
<Route exact={true} path="/contactsList" component={ContactsList} />
<Route exact={true} path="/login" component={Login} />
<Route exact={true} path="/" component={GamesList} /> */
}
