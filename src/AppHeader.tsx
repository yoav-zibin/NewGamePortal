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
// import { withRouter } from 'react-router-dom';
// import * as H from 'history';

interface Props {
  matchesList: MatchInfo[];
  gamesList: GameInfo[];
  userIdsAndPhoneNumbers: UserIdsAndPhoneNumbers;
  phoneNumberToContact: PhoneNumberToContact;
  myUser: MyUser;
  // react-router-dom says match<P> is the type, not sure what P should be
  // match: any;
  // location: H.Location;
  // history: H.History;
}
(function(history: any){
    console.log('HISTORY:', history);
    var pushState = history.pushState;
    history.pushState = function(state:Object) {
        if (typeof history.onpushstate === "function") {
            history.onpushstate({state: state});
        }
        // ... whatever else you want to do
        // maybe call onhashchange e.handler
        return pushState.apply(history, arguments);
    };
})(window.history);

window.onpopstate = history.onpushstate = function(e:any) {

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
    // console.log('PROPS LOCATION:', this.props.location);
    // console.log('PROPS HISTORY:', this.props.history);
    // console.log('PROPS MATCH:', this.props.match);
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

// export default connect(mapStateToProps)(withRouter(AppHeader));
export default connect(mapStateToProps)(AppHeader);
