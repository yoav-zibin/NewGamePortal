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

interface Props {
  matchesList: MatchInfo[];
  gamesList: GameInfo[];
  userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers;
  phoneNumberToContact: PhoneNumberToContact;
  myUser: MyUser;
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
      let title = ''; // String to build

      // Get corresponding info for selected match
      this.props.matchesList.forEach((match: MatchInfo) => {
        if (match.matchId === matchId) {
          const game: GameInfo = match.game;
          title += game.gameName;
          console.log(
            'PARTICIPANTUDERIDS LENGTH: ',
            match.participantsUserIds.length
          );
          console.log('MY USER ID: ', this.props.myUser.myUserId);
          // Is the game multiplayer? If so convert ID --> Phone --> Contact
          if (match.participantsUserIds.length > 1) {
            title += ' with ';
            match.participantsUserIds.forEach((participantId: string) => {
              // Exclude myself
              if (participantId !== this.props.myUser.myUserId) {
                console.log('PARTICIPANTID', participantId);
                const phoneNumber = this.props.userIdsAndPhoneNumbers
                  .userIdToPhoneNumber[participantId];
                console.log('PHONE NUMBER: ', phoneNumber);
                const contact = this.props.phoneNumberToContact[phoneNumber];
                console.log('CONTACT NAME: ', contact);
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
  gamesList: state.gamesList,
  userIdsAndPhoneNumbers: state.userIdsAndPhoneNumbers,
  phoneNumberToContact: state.phoneNumberToContact,
  myUser: state.myUser
});

export default connect(mapStateToProps)(AppHeader);
