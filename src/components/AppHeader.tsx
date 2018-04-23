import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer } from '../types';
import { MatchInfo, StoreState, UserIdToInfo, MyUser } from '../types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as H from 'history';
import { getOpponents, findMatch } from '../globals';

interface Props {
  matchInfo: MatchInfo;
  userIdToInfo: UserIdToInfo;
  myUser: MyUser;
  // react-router-dom says match<P> is the type, not sure what P should be
  match: any;
  location: H.Location;
  history: H.History;
}

class AppHeader extends React.Component<Props, {}> {
  routes: StringIndexer = {
    '/login': 'Login',
    '/addMatch': 'Create a new game',
    '/': 'My games'
  };

  showBackButton() {
    let pathname: string = this.props.location.pathname;
    if (pathname === '/login' || pathname === '/') {
      return false;
    }
    return true;
  }
  // Header for AppBar
  getLocation() {
    let pathname: string = this.props.location.pathname;
    let result = this.routes[pathname];
    if (result) {
      return result;
    } else if (pathname.startsWith('/contactsList/')) {
      return 'Contacts List';
    } else if (pathname.startsWith('/matches/')) {
      let gameInfo = this.props.matchInfo;
      let title = '';

      if (gameInfo) {
        title = this.props.matchInfo.game.gameName; // String to build
        if (this.props.matchInfo.participantsUserIds.length > 1) {
          title += ' with ';

          title += getOpponents(
            this.props.matchInfo.participantsUserIds,
            this.props.myUser.myUserId,
            this.props.userIdToInfo
          )
            .map(opponent => opponent.name)
            .join(', ');
        }
      }
      return title;
    } else {
      return '';
    }
  }

  // When back button is clicked
  handleOnClick = () => {
    this.props.history.goBack();
  };

  render() {
    if (this.showBackButton()) {
      return (
        <AppBar
          iconElementLeft={
            <IconButton>
              <NavigationArrowBack onClick={this.handleOnClick} />
            </IconButton>
          }
          title={this.getLocation()}
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
      );
    } else {
      return (
        <AppBar
          title={this.getLocation()}
          iconClassNameRight="muidocs-icon-navigation-expand-more"
          showMenuIconButton={false}
        />
      );
    }
  }
}

const mapStateToProps = (state: StoreState, ownProps: Props) => {
  let matchInfo;
  let pathname = ownProps.location.pathname;
  // We need match info for title
  if (pathname.startsWith('/matches/')) {
    let matchId = pathname.split('/')[2];

    matchInfo = findMatch(state.matchesList, matchId);

    if (matchInfo) {
      return {
        matchInfo: matchInfo,
        userIdToInfo: state.userIdToInfo,
        myUser: state.myUser
      };
    }
  }
  // We're not on a match or matchInfo is not found
  return {
    userIdToInfo: state.userIdToInfo,
    myUser: state.myUser
  };
};

// export default connect(mapStateToProps)(withRouter(AppHeader));
export default withRouter(connect(mapStateToProps)(AppHeader));
