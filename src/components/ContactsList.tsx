import * as React from 'react';
import { Contact, RouterMatchParams, UserInfo, PhoneNumInfo } from '../types';
import { MatchInfo } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import RaisedButton from 'material-ui/RaisedButton';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import PersonAdd from 'material-ui/svg-icons/social/person-add';
import CommunicationTextsms from 'material-ui/svg-icons/communication/textsms';
import ImportContacts from 'material-ui/svg-icons/communication/import-contacts';
import { ourFirebase } from '../services/firebase';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { History } from 'history';
import {
  checkNotNull,
  isAndroid,
  findMatch,
  getPhoneNumberToUserInfo,
  checkPhoneNumber,
  UNKNOWN_NAME,
  isApp
} from '../globals';
import { storeStateDefault } from '../stores/defaults';

const searchStyle: React.CSSProperties = {
  marginLeft: 17,
  marginRight: 23
};

interface UserName {
  name: string;
  isUser: boolean;
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
  users: UserInfo[];
  notUsers: Contact[];
  allUserNames: UserName[];
  currentMatch: MatchInfo;
  myUserId: string;
  myCountryCode: string;
  // if Object.keys(state.phoneNumberToContact)=[] (i.e., the user didn't give
  // the permission to fetch contacts), then let's ALSO ask the user to enter his
  // friends phone number (in addition to showing the regular UI because there user
  // might have contacts from previously searching for phone number).
  // Then we use parsePhoneNumber as usual to convert
  // that number to an international number, and verify it's a valid mobile number.
  // If so, call ourFirebase.searchPhoneNumber to see if that phone number is a user or not,
  // and then either add that user as a participant or send invite SMS.
  searchByNumber: boolean;

  history: History;
  match: RouterMatchParams;
}
interface State {
  // phone numbers we didn't find when searching a number.
  phoneNumbersNotFound: string[];
  didFetchContacts: boolean;
}

class ContactsList extends React.Component<Props, State> {
  state = {
    phoneNumbersNotFound: [] as string[],
    didFetchContacts: false
  };

  handleRequest = (chosenRequest: DataSourceConfig, index: number) => {
    console.log(chosenRequest);
    const chosenText = chosenRequest.text;
    let chosenUser = this.props.users.find(
      user => user.displayName === chosenText
    );
    if (chosenUser) {
      this.handleAddUser(chosenUser.userId);
    } else {
      let chosenNotUser = this.props.notUsers.find(
        user => user.name === chosenText
      );
      if (chosenNotUser) {
        this.handleAddNotUser(chosenNotUser.phoneNumber);
      } else {
        console.warn("Didn't find ", chosenText);
      }
    }
    return index;
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

  addContactNotFound = (phoneNumber: string) => {
    if (this.state.phoneNumbersNotFound.indexOf(phoneNumber) !== -1) {
      // phoneNumber is already in our list.
      return;
    }
    const phoneNumbersNotFound = [phoneNumber].concat(
      this.state.phoneNumbersNotFound
    );
    this.setState({ phoneNumbersNotFound });
  };

  handleRequestNumber = (chosenRequest: string) => {
    const myCountryCode = this.props.myCountryCode;
    let phoneInfo: PhoneNumInfo | null = checkPhoneNumber(
      chosenRequest,
      myCountryCode
    );
    console.log(
      'request number is ',
      chosenRequest,
      ' myCountryCode=',
      myCountryCode,
      ' phoneInfo=',
      phoneInfo
    );
    if (!phoneInfo || !phoneInfo.isValidNumber) {
      this.addContactNotFound(chosenRequest);
    } else {
      const phoneNumber = phoneInfo.e164Format;
      ourFirebase.searchPhoneNumber(phoneNumber).then(user => {
        console.log('searchPhoneNumber returned ', user);
        if (user == null) {
          this.addContactNotFound(phoneNumber);
        }
      });
    }
  };

  handleAddNotUser = (phoneNumber: string) => {
    if (isApp) {
      console.log('Sending SMS to ', phoneNumber);
      this.sendSms(
        phoneNumber,
        // Play games and videochat with your friends!
        "Let's videochat and play " +
          this.props.currentMatch.game.gameName +
          ' together! Download the app on https://zibiga.com'
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
            console.warn('[WARN] Permission not accepted');
          }
        );
      }
    };
    const error = function(e: any) {
      alert('Something went wrong:' + e);
    };
    window.sms.hasPermission(success, error);
  };

  sendSms = (phoneNum: string, message: string) => {
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

  render() {
    console.log(
      'ContactsList render: #users=',
      this.props.users.length,
      ' #contacts=',
      this.props.notUsers.length
    );
    let searchField = this.props.searchByNumber ? (
      <AutoComplete
        floatingLabelText="Search By PhoneNumber"
        filter={AutoComplete.fuzzyFilter}
        dataSource={[]}
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
              rightIcon={
                username.isUser ? <PersonAdd /> : <CommunicationTextsms />
              }
            />
          )
        }))}
        maxSearchResults={5}
        fullWidth={true}
        onNewRequest={this.handleRequest}
      />
    );

    return (
      <div>
        <div key="search" style={searchStyle}>
          {searchField}
        </div>
        {this.state.didFetchContacts || !this.props.searchByNumber ? null : (
          <RaisedButton
            onClick={() => {
              ourFirebase.fetchContacts();
              this.setState({
                didFetchContacts: true
              });
            }}
            label={'Import My Contacts'}
            style={searchStyle}
            icon={<ImportContacts />}
          />
        )}

        {this.state.phoneNumbersNotFound.length === 0 ? null : (
          <List key="contacts_not_found">
            <Subheader>Invite to Zibiga</Subheader>
            {this.state.phoneNumbersNotFound.map(phoneNumber => {
              return (
                <ListItem
                  key={phoneNumber}
                  primaryText={formatPhoneNumber(
                    this.props.myCountryCode,
                    phoneNumber
                  )}
                  onClick={() => this.handleAddNotUser(phoneNumber)}
                  rightIcon={<CommunicationTextsms />}
                />
              );
            })}
          </List>
        )}

        <List key="add_opponent">
          <Subheader>Add opponent</Subheader>
          {this.filterParticipants(this.props.users).map((user: UserInfo) => (
            <ListItem
              key={user.userId}
              primaryText={user.displayName}
              onClick={() => this.handleAddUser(user.userId)}
              rightIcon={<PersonAdd />}
            />
          ))}
        </List>

        {this.props.notUsers.length === 0 ? null : (
          <>
            <Divider />
            <List key="invite_contacts">
              <Subheader>Invite to Zibiga</Subheader>
              {this.props.notUsers.map((contact: Contact) => {
                return (
                  <ListItem
                    key={contact.phoneNumber}
                    primaryText={
                      contact.name === UNKNOWN_NAME ? '' : contact.name
                    }
                    secondaryText={formatPhoneNumber(
                      this.props.myCountryCode,
                      contact.phoneNumber
                    )}
                    onClick={() => this.handleAddNotUser(contact.phoneNumber)}
                    rightIcon={<CommunicationTextsms />}
                  />
                );
              })}
            </List>
          </>
        )}
      </div>
    );
  }
}

function formatPhoneNumber(myCountryCode: string, phoneNumber: string) {
  const parsed = checkPhoneNumber(phoneNumber, myCountryCode);
  return parsed && parsed.isValidNumber
    ? parsed.internationalFormat
    : phoneNumber;
}

const mapStateToProps = (state: StoreState, ownProps: Props) => {
  const myCountryCode = state.myUser.myCountryCode;
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
        name:
          contact.name +
          ' ' +
          formatPhoneNumber(myCountryCode, contact.phoneNumber),
        isUser: false
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
        isUser: true
      };
      allUserNames.push(userName);
    }
  }

  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));
  // Mentors should come last (because if you search by phoneNumber, then it adds the results to the list of users)
  const userIdToMentor = storeStateDefault.userIdToInfo;
  users.sort(
    (c1, c2) =>
      (userIdToMentor[c1.userId] ? 10 : 0) -
      (userIdToMentor[c2.userId] ? 10 : 0) +
      // localeCompare returns -1,0,1
      c1.displayName.localeCompare(c2.displayName)
  );

  let currentMatchId: string = ownProps.match.params.matchIdInRoute;
  let currentMatch = findMatch(state.matchesList, currentMatchId);
  return {
    users,
    notUsers,
    allUserNames,
    currentMatch,
    myUserId: state.myUser.myUserId,
    myCountryCode,
    searchByNumber: Object.keys(state.phoneNumberToContact).length === 0
  };
};
export default connect(mapStateToProps)(ContactsList);
