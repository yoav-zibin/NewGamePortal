import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import { red500 } from 'material-ui/styles/colors';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer, RouterMatchParams } from '../types';
import { MatchInfo, StoreState, UserIdToInfo, MyUser } from '../types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as H from 'history';
import { getOpponents, findMatch, deepCopy } from '../globals';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import VolumeUp from 'material-ui/svg-icons/av/volume-up';
import VolumeMute from 'material-ui/svg-icons/av/volume-mute';
import Replay from 'material-ui/svg-icons/av/replay';
import PersonAdd from 'material-ui/svg-icons/social/person-add';
import School from 'material-ui/svg-icons/social/school';
import Delete from 'material-ui/svg-icons/action/delete';
import { Action } from '../reducers';
import { dispatch } from '../stores';
import MenuItem from 'material-ui/MenuItem';
import IconMenu from 'material-ui/IconMenu';
import { MatchStateHelper } from '../services/matchStateHelper';
import { ourFirebase } from '../services/firebase';
import { Divider, Dialog, FlatButton } from 'material-ui';

interface PropsWithoutRouter {
  matchInfo: MatchInfo | undefined;
  userIdToInfo: UserIdToInfo;
  myUser: MyUser;
  audioMute: boolean;
}
interface Props extends PropsWithoutRouter {
  location: H.Location;
  history: H.History;
  match: RouterMatchParams;
}

class AppHeader extends React.Component<Props, {}> {
  routes: StringIndexer = {
    '/login': 'Login',
    '/addMatch': 'Create a new game',
    '/': 'My games'
  };
  state = {
    showRules: false
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
      let matchInfo = this.props.matchInfo;
      let title = '';

      if (matchInfo) {
        title = matchInfo.game.gameName; // String to build
        const participantsUserIds = matchInfo.participantsUserIds;
        if (participantsUserIds.length > 1) {
          title += ' with ';

          title += getOpponents(
            participantsUserIds,
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
    // (window as any).audioMute = !this.state.audioMute;
    // this.setState({ audioMute: !this.state.audioMute });
    let action: Action = {
      setAudioMute: !this.props.audioMute
    };
    dispatch(action);
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

  handleAddFriendClick = () => {
    this.props.history.push('/contactsList/' + this.props.matchInfo!.matchId);
  };

  handleGameRulesClick = () => {
    this.setState({ showRules: true });
  };
  handleDialogClose = () => {
    this.setState({ showRules: false });
  };
  handleResetMatchClick = () => {
    let match: MatchInfo = deepCopy(this.props.matchInfo!);
    new MatchStateHelper(match).resetMatch();
    ourFirebase.updateMatchState(match);
    console.log('reset match');
  };

  handleLeaveMatchClick = () => {
    console.log('leave match');
    ourFirebase.leaveMatch(this.props.matchInfo!);
    this.props.history.replace('/');
  };

  render() {
    let volume = this.props.audioMute ? <VolumeMute /> : <VolumeUp />;
    if (this.onPlayingScreen() && this.props.matchInfo) {
      // We're on Playing Screen, which needs 'add' button and mute button
      console.log('ON PLAYING SCREEN');
      const isInviteFriendDisabled =
        this.props.matchInfo.participantsUserIds.length >= ourFirebase.MAX_USERS_IN_MATCH - 1;
      const isGameRulesDisabled = !this.props.matchInfo.game.wikipediaUrl;
      const actions = [
        <FlatButton key="OK" label="OK" primary={true} onClick={this.handleDialogClose} />
      ];
      // We're on Playing Screen, which needs 'add' button and mute button
      return (
        <AppBar
          iconElementLeft={
            <IconButton>
              <NavigationArrowBack onClick={this.handleNavigationClick} />
            </IconButton>
          }
          iconElementRight={
            <div>
              <IconMenu
                iconButtonElement={
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                }
                iconStyle={{ color: 'white' }}
                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem
                  primaryText="Invite a friend"
                  onClick={this.handleAddFriendClick}
                  rightIcon={<PersonAdd />}
                  disabled={isInviteFriendDisabled}
                />
                <MenuItem
                  primaryText={this.props.audioMute ? 'Play game sounds' : 'Mute game sounds'}
                  onClick={this.handleAudioClick}
                  rightIcon={volume}
                />
                <MenuItem
                  primaryText="Show Game Rules"
                  onClick={this.handleGameRulesClick}
                  rightIcon={<School />}
                  disabled={isGameRulesDisabled}
                />
                <Divider />
                <MenuItem
                  style={{ color: red500 }}
                  primaryText="Reset game"
                  onClick={this.handleResetMatchClick}
                  rightIcon={<Replay color={red500} />}
                />
                <Divider />
                <MenuItem
                  style={{ color: red500 }}
                  primaryText="Leave game"
                  onClick={this.handleLeaveMatchClick}
                  rightIcon={<Delete color={red500} />}
                />
              </IconMenu>
              <Dialog
                title={'Rules for ' + this.props.matchInfo.game.gameName}
                actions={actions}
                contentStyle={{ width: '90%', maxWidth: 'none' }}
                autoDetectWindowHeight={false}
                autoScrollBodyContent={false}
                modal={false}
                open={this.state.showRules}
                onRequestClose={this.handleDialogClose}
              >
                {/* 99% to prevent dialog from having width scrollbar */}
                <iframe src={this.props.matchInfo.game.wikipediaUrl} width="99%" height="99%" />
              </Dialog>
            </div>
          }
          title={this.getLocation()}
        />
      );
    } else if (this.showBackButton()) {
      // We're on a page that needs back button
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

const mapStateToProps = (state: StoreState, ownProps: Props): PropsWithoutRouter => {
  let matchInfo: MatchInfo | undefined;
  let pathname = ownProps.location.pathname;
  // We need match info for title
  if (pathname.startsWith('/matches/')) {
    let matchId = pathname.split('/')[2];
    matchInfo = findMatch(state.matchesList, matchId);
  }
  return {
    matchInfo: matchInfo,
    userIdToInfo: state.userIdToInfo,
    myUser: state.myUser,
    audioMute: state.audioMute
  };
};

export default withRouter((connect(mapStateToProps) as any)(AppHeader));
