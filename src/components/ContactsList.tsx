import * as React from 'react';
import { Contact, RouterMatchParams, UserInfo, PhoneNumInfo } from '../types';
import { MatchInfo } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import FloatingActionButton from 'material-ui/FloatingActionButton';
// import Snackbar from 'material-ui/Snackbar';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import { ourFirebase } from '../services/firebase';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { History } from 'history';
import {
  checkNotNull,
  isAndroid,
  isIos,
  findMatch,
  getPhoneNumberToUserInfo,
  checkPhoneNumber
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
  myCountryCode: string;
  history: History;
  searchByNumber: boolean;
}

class ContactsList extends React.Component<Props, {}> {
  // timer: any = undefined;

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
    message: 'Message sent',
    notUsers: this.props.notUsers
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

  handleRequestNumber = (chosenRequest: String, index: number) => {
    console.log('request number is ' + chosenRequest + '  ' + event + index);
    let phoneInfo: PhoneNumInfo | null = checkPhoneNumber(
      chosenRequest,
      this.props.myCountryCode
    );
    console.log(phoneInfo);
    if (phoneInfo && phoneInfo.isValidNumber) {
      ourFirebase.searchPhoneNumber(phoneInfo.e164Format).then((user)=>{
        if(user==null){
          let userInfo:Contact = {
            phoneNumber: phoneInfo!.e164Format,
            name: " "
          };
          this.setState({notUsers: [userInfo]})
        }
      });
    }

  };

  handleAddNotUser = (contact: Contact) => {
    if (isAndroid || isIos) {
      console.log('Sending SMS to ', contact.name);
      this.sendSms(
        contact,
        'Your friend would like to invite you to a game in GamePortal!'
      );
    }
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
        intent: 'INTENT' // send SMS with the native android SMS messaging
      }
    };

    const success = () => {
      console.log('Message sent successfully');
    };
    const error = (e: any) => {
      console.log('Message Error: ' + e);
    };

    if (isAndroid) {
      this.requestSMSPermission();
    }
    window.sms.send(phoneNum, message, options, success, error);
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

  render() {
    let searchField =
      this.props.searchByNumber ? (
        <AutoComplete
          floatingLabelText="Search By PhoneNumber"
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
          onNewRequest={this.handleRequestNumber}
        />
      ) : (
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
          {this.filterContacts(this.state.notUsers).map((contact: Contact) => {
            const parsed: PhoneNumInfo | null = checkPhoneNumber(
              contact.phoneNumber,
              this.props.myCountryCode
            );
            return (
              <ListItem
                key={contact.phoneNumber}
                primaryText={
                  contact.name +
                  (parsed && parsed.isValidNumber
                    ? `(${parsed.internationalFormat})`
                    : '')
                }
                rightIconButton={
                  <RaisedButton
                    label="invite"
                    primary={true}
                    style={style}
                    onClick={() => this.handleAddNotUser(contact)}
                  />
                }
              />
            );
          })}
        </List>
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
    myCountryCode: state.myUser.myCountryCode,
    searchByNumber: Object.keys(state.phoneNumberToContact).length<=0
  };
};
export default connect(mapStateToProps)(ContactsList);
