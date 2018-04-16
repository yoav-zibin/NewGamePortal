import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer } from '../types';
import {
  MatchInfo,
  StoreState,
  UserIdsAndPhoneNumbers,
  PhoneNumberToContact,
  MyUser
} from '../types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as H from 'history';
import { getOpponents } from '../globals';

interface Props {
  matchInfo: MatchInfo;
  userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers;
  phoneNumberToContact: PhoneNumberToContact;
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

  // Header for AppBar
  getLocation() {
    let pathname: string = this.props.location.pathname;
    let result = this.routes[pathname];
    if (result) {
      return result;
    } else if (pathname.startsWith('/contactsList/')) {
      return 'Contacts List';
    } else if (pathname.startsWith('/matches/')) {
      console.log(this.props.matchInfo.game.gameName);
      let title = this.props.matchInfo.game.gameName || 'Playing '; // String to build
      if (this.props.matchInfo.participantsUserIds.length > 1) {
        title += ' with ';
        getOpponents(
          this.props.matchInfo.participantsUserIds,
          this.props.myUser.myUserId,
          this.props.userIdsAndPhoneNumbers.userIdToPhoneNumber,
          this.props.phoneNumberToContact
        ).forEach((opponent: any) => {
          title += opponent.name;
        });
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

const mapStateToProps = (state: StoreState, ownProps: Props) => {
  let matchInfo;
  let pathname = ownProps.location.pathname;
  // We need match info for title
  if (pathname.startsWith('/matches/')) {
    let matchId = pathname.split('/')[2];

    matchInfo = state.matchesList.find((match: any) => {
      return matchId === match.matchId ? match : {};
    });

    return {
      matchInfo: matchInfo,
      userIdsAndPhoneNumbers: state.userIdsAndPhoneNumbers,
      phoneNumberToContact: state.phoneNumberToContact,
      myUser: state.myUser
    };
  } else {
    // We're not on a match
    return {
      userIdsAndPhoneNumbers: state.userIdsAndPhoneNumbers,
      phoneNumberToContact: state.phoneNumberToContact,
      myUser: state.myUser
    };
  }
};

// export default connect(mapStateToProps)(withRouter(AppHeader));
export default connect(mapStateToProps)(withRouter(AppHeader));
