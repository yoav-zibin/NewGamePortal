import * as React from 'react';
import { Contact, RouterMatchParams, UserInfo } from '../types';
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
import TextField from 'material-ui/TextField';
import {
  checkNotNull,
  isAndroid,
  isIos,
  findMatch,
  getPhoneNumberToUserInfo
} from '../globals';

const style: React.CSSProperties = {
  marginRight: 20
};

const searchStyle: React.CSSProperties = {
  marginLeft: 17,
  marginRight: 23
};

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
  users: UserInfo[];
  notUsers: Contact[];
  allUserNames: UserName[];
  match: RouterMatchParams;
  currentMatch: MatchInfo;
  myUserId: string;
  history: History;
  myUserCountryCode: string;
}

class ContactsList extends React.Component<Props, {}> {
  timer: any = undefined;

  // TODO: if Object.keys(state.phoneNumberToContact)=[] (i.e., the user didn't give
  // the permission to fetch contacts), then let's ALSO ask the user to enter his
  // friends phone number (in addition to showing the regular UI because there user
  // might have contacts from previously searching for phone number).
  // Then we use parsePhoneNumber as usual to convert
  // that number to an international number, and verify it's a valid mobile number.
  // If so, call ourFirebase.searchPhoneNumber to see if that phone number is a user or not,
  // and then either add that user as a participant or send invite SMS.
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
      let chosenUser = this.props.users.find(
        user => user.displayName === chosenRequest.text
      );
      this.handleAddUser(chosenUser!.userId);
    } else {
      let chosenUser = this.props.notUsers.find(
        user => user.name === chosenRequest.text
      );
      this.handleAddNotUser(chosenUser!);
    }
    return index;
  };

  handleUpdate = (searchText: string) => {
    if (searchText.length === 0) {
      this.setState({ filterValue: '' });
    }
  };

  getMatch = () => {
    return checkNotNull(this.props.currentMatch)!;
  };

  handleAddUser = (userId: string) => {
    console.log('Adding participant userId=', userId);
    let currentMatch = this.getMatch();
    ourFirebase.addParticipant(currentMatch, userId);
    this.props.history.push('/matches/' + currentMatch.matchId);
  };

  handleRequestNumber = (event: object, requestNumber: string) => {
    console.log('request number is ' + requestNumber + '  ' + event);
    let phoneInfo: PhoneNumInfo = parsePhoneNumber(
      requestNumber,
      this.props.myUserCountryCode
    );
    ourFirebase.searchPhoneNumber();
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

  filterParticipants(contacts: UserInfo[]): UserInfo[] {
    let participantsUserIds = this.getMatch().participantsUserIds;
    // Filter out existing participants.
    return contacts.filter(
      contact => participantsUserIds.indexOf(contact.userId) === -1
    );
  }

  filterContacts(contacts: Contact[]): Contact[] {
    return contacts.filter(
      contact => contact.name.indexOf(this.state.filterValue) !== -1
    );
  }

  filterUsers(contacts: UserInfo[]): UserInfo[] {
    return contacts.filter(
      contact => contact.displayName.indexOf(this.state.filterValue) !== -1
    );
  }

  // TODO: show formatted phone numbers next to non-users (like in Duo).
  // const phoneInfo: PhoneNumInfo = parsePhoneNumber(localNumber, myCountryCode);
  render() {
    let searchField =
      this.props.allUserNames.length > 0 ? (
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
      ) : (
        <TextField
          hintText="Search"
          fullWidth={true}
          onChange={this.handleRequestNumber}
        />
      );

    return (
      <div>
        <div style={searchStyle}>{searchField}</div>

        <List>
          <Subheader>Game User</Subheader>
          {this.filterParticipants(this.filterUsers(this.props.users)).map(
            (user: UserInfo) => (
              <ListItem
                key={user.userId}
                primaryText={user.displayName}
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
  const users: UserInfo[] = [];
  const notUsers: Contact[] = [];
  const allUserNames: UserName[] = [];
  const phoneNumberToInfo = getPhoneNumberToUserInfo(state.userIdToInfo);
  for (let [phoneNumber, contact] of Object.entries(
    state.phoneNumberToContact
  )) {
    if (!phoneNumberToInfo[phoneNumber]) {
      notUsers.push(contact);
      let userName: UserName = {
        name: contact.name,
        userType: 'Invite with SMS'
      };
      allUserNames.push(userName);
    }
  }
  for (let [userId, userInfo] of Object.entries(state.userIdToInfo)) {
    if (userId === state.myUser.myUserId) {
      // Ignore my user (in case I have my own phone number in my contacts)
    } else {
      users.push(userInfo);
      let userName: UserName = {
        name: userInfo.displayName,
        userType: 'Existing user'
      };
      allUserNames.push(userName);
    }
  }

  users.sort((c1, c2) => c1.displayName.localeCompare(c2.displayName));
  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));

  let currentMatchId: string = ownProps.match.params.matchIdInRoute;
  let currentMatch = findMatch(state.matchesList, currentMatchId);

  return {
    users,
    notUsers,
    allUserNames,
    currentMatch,
    myUserId: state.myUser.myUserId,
    myUserCountryCode: state.myUser.myCountryCode
  };
};
export default connect(mapStateToProps)(ContactsList);
