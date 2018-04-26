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
import { FloatingActionButton } from 'material-ui';
import ContentAdd from 'material-ui/svg-icons/content/add';
import VolumeUp from 'material-ui/svg-icons/av/volume-up';
import VolumeMute from 'material-ui/svg-icons/av/volume-mute';

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
  state = {
    audioMute: false
  };

  routes: StringIndexer = {
    '/login': 'Login',
    '/addMatch': 'Create a new game',
    '/': 'My games'
  };

  onPlayingScreen() {
    let pathname: string = this.props.location.pathname;
    if (pathname.startsWith('/matches/')) {
      return true;
    }
    return false;
  }

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
  handleAudioClick = () => {
    console.log('Clicked audio button');
    (window as any).audioMute = !this.state.audioMute;
    this.setState({ audioMute: !this.state.audioMute });
  };
  // When back button is clicked
  handleNavigationClick = () => {
    let pathname: string = this.props.location.pathname;
    if (pathname.startsWith('/matches/')) {
      this.props.history.replace('/');
    } else {
      this.props.history.goBack();
    }
  };

  render() {
    let volume = this.state.audioMute ? (
      <FloatingActionButton
        style={{ marginRight: 40 }}
        mini={true}
        onClick={this.handleAudioClick}
      >
        <VolumeMute />
      </FloatingActionButton>
    ) : (
      <FloatingActionButton
        style={{ marginRight: 40 }}
        mini={true}
        onClick={this.handleAudioClick}
      >
        <VolumeUp />
      </FloatingActionButton>
    );
    if (this.onPlayingScreen()) {
      // We're on Playing Screen, which needs 'add' button and mute button
      console.log('ON PLAYING SCREEN');
      return (
        <AppBar
          iconElementLeft={
            <IconButton>
              <NavigationArrowBack onClick={this.handleNavigationClick} />
            </IconButton>
          }
          iconElementRight={
            <div>
              {volume}
              <FloatingActionButton
                style={{ marginRight: 20 }}
                mini={true}
                onClick={() =>
                  this.props.history.push(
                    '/contactsList/' + this.props.matchInfo!.matchId
                  )
                }
              >
                <ContentAdd />
              </FloatingActionButton>
            </div>
          }
          title={this.getLocation()}
        />
      );
    } else if (this.showBackButton()) {
      // We're on a page that needs back button
      console.log('SHOWING BACK BUTTON');
      return (
        <AppBar
          iconElementLeft={
            <IconButton>
              <NavigationArrowBack onClick={this.handleNavigationClick} />
            </IconButton>
          }
          title={this.getLocation()}
        />
      );
    } else {
      // We're on login or matches page
      console.log('ON LOGIN/HOME PAGE');
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
