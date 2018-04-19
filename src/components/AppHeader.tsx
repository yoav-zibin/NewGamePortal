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
import { withRouter, match } from 'react-router-dom';
import * as H from 'history';
import { getOpponents } from '../globals';

type matchParams = {
  matchId: string;
};

interface Props {
  matchesList: MatchInfo[];
  userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers;
  phoneNumberToContact: PhoneNumberToContact;
  myUser: MyUser;
  match: match<matchParams>;
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
    let matchId = pathname.split('/')[2];

    let matchInfo;
    if (pathname.startsWith('/matches/')) {
      for(let currMatch of this.props.matchesList) {
        if (currMatch.matchId === matchId) {
          matchInfo = currMatch;
        }
      }
    }
    let result = this.routes[pathname];
    if (result) {
      return result;
    } else if (pathname.startsWith('/contactsList/')) {
      return 'Contacts List';
    } else if (pathname.startsWith('/matches/')) {
      let title = 'Playing Game';
      if (matchInfo) {
        title = matchInfo.game.gameName; // String to build
        if (matchInfo.participantsUserIds.length > 1) {
          title += ' with ';
          getOpponents(
            matchInfo.participantsUserIds,
            this.props.myUser.myUserId,
            this.props.userIdsAndPhoneNumbers.userIdToPhoneNumber,
            this.props.phoneNumberToContact
          ).forEach((opponent: any) => {
            title += opponent.name;
          });
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
    const title = this.getLocation();
    return (
      <AppBar
        iconElementLeft={
          <FloatingActionButton mini={true} onClick={this.handleOnClick}>
            <NavigationArrowBack />
          </FloatingActionButton>
        }
        title={title}
        iconClassNameRight="muidocs-icon-navigation-expand-more"
      />
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
    matchesList: state.matchesList,
    userIdsAndPhoneNumbers: state.userIdsAndPhoneNumbers,
    phoneNumberToContact: state.phoneNumberToContact,
    myUser: state.myUser
});

// export default connect(mapStateToProps)(withRouter(AppHeader));
export default withRouter(connect(mapStateToProps)(AppHeader));
