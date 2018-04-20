import * as React from 'react';
import { Contact, RouterMatchParams } from '../types';
import { MatchInfo } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import Snackbar from 'material-ui/Snackbar';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import { ourFirebase } from '../services/firebase';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { History } from 'history';
import { checkNotNull, isAndroid, isIos } from '../globals';

const style: React.CSSProperties = {
  marginRight: 20
};

const searchStyle: React.CSSProperties = {
  marginLeft: 17,
  marginRight: 23
};

interface ContactWithUserId extends Contact {
  userId: string;
}

interface UserName {
  name: string;
  userType: 'Invite with SMS' | 'Existing user';
}

interface DataSourceConfig {
  text: string;
  value: {
    props: {
      primaryText: string;
      secondaryText: string;
    };
  };
}

interface Props {
  matchesList: MatchInfo[];
  users: ContactWithUserId[];
  notUsers: Contact[];
  allUserNames: UserName[];
  match: RouterMatchParams;
  currentMatch: MatchInfo;
  myUserId: string;
  history: History;
}

class ContactsList extends React.Component<Props, {}> {
  timer: any = undefined;

  state = {
    filterValue: '',
    stay: false,
    message: 'Message sent',
    autoHideDuration: 3000,
    snackBarOpen: false
  };

  handleRequest = (chosenRequest: DataSourceConfig, index: number) => {
    if (chosenRequest.text.length > 0) {
      this.setState({ filterValue: chosenRequest.text });
    }
    console.log(chosenRequest);

    if (chosenRequest.value.props.secondaryText === 'Existing user') {
      let chosenUser: any = this.props.users.find(
        user => user.name === chosenRequest.text
      );
      this.handleAddUser(chosenUser.userId);
    } else {
      let chosenUser: any = this.props.notUsers.find(
        user => user.name === chosenRequest.text
      );
      this.handleAddNotUser(chosenUser);
    }
    return index;
  };

  handleUpdate = (searchText: string) => {
    if (searchText.length === 0) {
      this.setState({ filterValue: '' });
    }
  };

  getMatch = () => {
    /*let currentMatchId: String = this.props.match.params.matchIdInRoute;
    let currentMatch = this.props.matchesList.find(
      match => match.matchId === currentMatchId
    );*/
    return checkNotNull(this.props.currentMatch)!;
  };

  handleAddUser = (userId: string) => {
    console.log('Adding participant userId=', userId);
    let currentMatch = this.getMatch();
    ourFirebase.addParticipant(currentMatch, userId);
    this.props.history.push('/matches/' + currentMatch.matchId);
  };

  componentWillUnMount() {
    clearTimeout(this.timer);
  }

  handleAddNotUser = (contact: Contact) => {
    // TODO: Herbert, send the SMS here in ios/android.
    if (isAndroid || isIos) {
      console.log('Sending SMS to ', contact);
      // this.sendSms(contact, 'Your friend would like to invite you to GamePortal!');
    }
    this.setState({ snackBarOpen: true });
    // let currentMatch = this.getMatch();
    console.log(!this.state.stay);
    // this.timer = setTimeout(() => {
    //   this.props.history.push('/matches/' + currentMatch.matchId)
    // }, 3000);
  };

  requestSMSPermission = () => {
    const success = (hasPermission: boolean) => {
      if (!hasPermission) {
        window.sms.requestPermission(
          () => {
            console.log('[OK] Permission accepted');
          },
          () => {
            console.log('[WARN] Permission not accepted');
          }
        );
      }
    };
    const error = function(e: any) {
      alert('Something went wrong:' + e);
    };
    window.sms.hasPermission(success, error);
  };

  sendSms = (contact: Contact, message: String) => {
    const phoneNum = contact.phoneNumber;
    console.log('number=' + phoneNum + ', message= ' + message);

    const options = {
      replaceLineBreaks: false, // true to replace \n by a new line, false by default
      android: {
        intent: '' // send SMS with the native android SMS messaging
      }
    };

    const success = () => {
      console.log('Message sent successfully');
    };
    const error = () => {
      console.log('Message Failed');
    };

    this.requestSMSPermission();
    window.sms.send(phoneNum, message, options, success, error);
  };

  handleActionClick = () => {
    this.setState({
      snackBarOpen: false
    });
    // clearTimeout(this.timer);
  };

  handleRequestClose = () => {
    if (this.state.snackBarOpen) {
      // let currentMatch = this.getMatch();
      // this.props.history.push('/matches/' + currentMatch.matchId);
      this.props.history.goBack();
    }
  };

  filterParticipants(contacts: ContactWithUserId[]): ContactWithUserId[] {
    let participantsUserIds = this.getMatch().participantsUserIds;
    // Filter out existing participants.
    return contacts.filter(
      contact => participantsUserIds.indexOf(contact.userId) === -1
    );
  }

  filterContacts<T extends Contact>(contacts: T[]): T[] {
    return contacts.filter(
      contact => contact.name.indexOf(this.state.filterValue) !== -1
    );
  }
  // TODO: show formatted phone numbers next to non-users (like in Duo).
  // const phoneInfo: PhoneNumInfo = parsePhoneNumber(localNumber, myCountryCode);
  render() {
    return (
      <div>
        <div style={searchStyle}>
          <AutoComplete
            floatingLabelText="Search"
            filter={AutoComplete.fuzzyFilter}
            dataSource={this.props.allUserNames.map((username: UserName) => ({
              text: username.name,
              value: (
                <MenuItem
                  primaryText={username.name}
                  secondaryText={username.userType}
                />
              )
            }))}
            maxSearchResults={5}
            fullWidth={true}
            onNewRequest={this.handleRequest}
            onUpdateInput={this.handleUpdate}
          />
        </div>

        <List>
          <Subheader>Game User</Subheader>
          {this.filterParticipants(this.filterContacts(this.props.users)).map(
            (user: ContactWithUserId) => (
              <ListItem
                key={user.phoneNumber}
                primaryText={user.name}
                rightIconButton={
                  <FloatingActionButton
                    mini={true}
                    style={style}
                    onClick={() => this.handleAddUser(user.userId)}
                  >
                    <ContentAdd />
                  </FloatingActionButton>
                }
              />
            )
          )}
        </List>
        <Divider />
        <List>
          <Subheader>Not Game User</Subheader>
          {this.filterContacts(this.props.notUsers).map((contact: Contact) => (
            <ListItem
              key={contact.phoneNumber}
              primaryText={contact.name}
              rightIconButton={
                <RaisedButton
                  label="invite"
                  primary={true}
                  style={style}
                  onClick={() => this.handleAddNotUser(contact)}
                />
              }
            />
          ))}
        </List>
        <Snackbar
          open={this.state.snackBarOpen}
          message={this.state.message}
          action="stay"
          autoHideDuration={this.state.autoHideDuration}
          onRequestClose={this.handleRequestClose}
          onActionClick={this.handleActionClick}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, ownProps: Props) => {
  const users: ContactWithUserId[] = [];
  const notUsers: Contact[] = [];
  const allUserNames: UserName[] = [];
  const phoneNumbers = Object.keys(state.phoneNumberToContact);
  for (let phoneNumber of phoneNumbers) {
    const contact = state.phoneNumberToContact[phoneNumber];
    const userId =
      state.userIdsAndPhoneNumbers.phoneNumberToUserId[phoneNumber];
    if (userId === state.myUser.myUserId) {
      // Ignore my user (in case I have my own phone number in my contacts)
    } else if (userId) {
      users.push({ ...contact, userId: userId });
      let userName: UserName = {
        name: contact.name,
        userType: 'Existing user'
      };
      allUserNames.push(userName);
    } else {
      notUsers.push(contact);
      let userName: UserName = {
        name: contact.name,
        userType: 'Invite with SMS'
      };
      allUserNames.push(userName);
    }
  }

  users.sort((c1, c2) => c1.name.localeCompare(c2.name));
  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));

  console.log('ownProps=', ownProps);
  // TODO: filter here!!! Use ownProps. Don't pass the entire matchesList.
  let currentMatchId: String = ownProps.match.params.matchIdInRoute;
  let currentMatch = state.matchesList.find(
    match => match.matchId === currentMatchId
  );
  return {
    users,
    notUsers,
    allUserNames,
    currentMatch,
    myUserId: state.myUser.myUserId
  };
};
export default connect(mapStateToProps)(ContactsList);
