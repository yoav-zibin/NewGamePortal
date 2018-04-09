import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer } from './types';

class AppHeader extends React.Component {
  routes: StringIndexer = {
    '/login': 'Login',
    '/contactsList': 'Add an opponent',
    '/addMatch': 'Create a new game',
    '/': 'My games'
  };

  // Header for AppBar
  getLocation() {
    let pathname: string = window.location.pathname;
    let result = this.routes[pathname];
    if (result) {
      return result;
    } else if (pathname.startsWith('/matches/')) {
      // On specific match page, render match ID
      let matchId = pathname.split('/')[2];
      // TODO: fix the name.
      return 'GAME_NAME with OPPONENTS' + matchId;
    } else {
      return '';
    }
  }

  // When back button is clicked
  handleOnClick() {
    window.history.go(-1);
  }

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
