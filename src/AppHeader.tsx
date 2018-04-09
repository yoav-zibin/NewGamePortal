import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer } from './types';
import { MatchInfo, StoreState, GameInfo } from './types';
import { connect } from 'react-redux';

interface Props {
  matchesList: MatchInfo[];
  gamesList: GameInfo[];
}

class AppHeader extends React.Component<Props, {}> {
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
      let matchId = pathname.split('/')[2];
      let title = '';
      this.props.matchesList.forEach((match: MatchInfo) => {
        if (match.matchId === matchId) {
          console.log('Found matchId');
          const game: GameInfo = match.game;
          title += game.gameName;
          if (match.participantsUserIds.length > 1) {
            title += ' with ';
            match.participantsUserIds.forEach((participantId: String) => {
              title += participantId;
            });
          }
        }
      });
      return title;
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

const mapStateToProps = (state: StoreState) => ({
  matchesList: state.matchesList,
  gamesList: state.gamesList
});

export default connect(mapStateToProps)(AppHeader);
