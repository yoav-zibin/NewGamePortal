import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { StringIndexer } from './types';
import {
  MatchInfo,
  StoreState,
  GameInfo,
  UserIdsAndPhoneNumbers,
  PhoneNumberToContact,
  MyUser
} from './types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
// import { withRouter } from 'react-router-dom';
// import * as H from 'history';

interface Props {
  matchesList: MatchInfo[];
  gamesList: GameInfo[];
  userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers;
  phoneNumberToContact: PhoneNumberToContact;
  myUser: MyUser;
  // react-router-dom says match<P> is the type, not sure what P should be
  match: any;
  location: any;
  history: any;
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
    // console.log('PROPS LOCATION:', this.props.location);
    // console.log('PROPS HISTORY:', this.props.history);
    // console.log('PROPS MATCH:', this.props.match);
    let result = this.routes[pathname];
    if (result) {
      return result;
    } else if (pathname.startsWith('/contactsList/')) {
      return 'Contacts List';
    } else if (pathname.startsWith('/matches/')) {
      let matchId = pathname.split('/')[2];
      let title = ''; // String to build

      // Get corresponding info for selected match
      this.props.matchesList.forEach((match: MatchInfo) => {
        if (match.matchId === matchId) {
          const game: GameInfo = match.game;
          title += game.gameName;
          // Is the game multiplayer? If so convert ID --> Phone --> Contact
          if (match.participantsUserIds.length > 1) {
            title += ' with ';
            match.participantsUserIds.forEach((participantId: string) => {
              // Exclude myself
              if (participantId !== this.props.myUser.myUserId) {
                const phoneNumber = this.props.userIdsAndPhoneNumbers
                  .userIdToPhoneNumber[participantId];
                const contact = this.props.phoneNumberToContact[phoneNumber];
                title += contact.name;
              }
            });
          } // End length if
        } // End matchId if
      });
      return title;
    } else {
      return '';
    }
  }

  // When back button is clicked
  handleOnClick() {
    this.props.history.goBack();
  }

  render() {
    return (
      <AppBar
        iconElementLeft={
          <FloatingActionButton
            mini={true}
            onClick={this.handleOnClick.bind(this)}
          >
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
  gamesList: state.gamesList,
  userIdsAndPhoneNumbers: state.userIdsAndPhoneNumbers,
  phoneNumberToContact: state.phoneNumberToContact,
  myUser: state.myUser
});

// export default connect(mapStateToProps)(withRouter(AppHeader));
export default connect(mapStateToProps)(withRouter(AppHeader));
