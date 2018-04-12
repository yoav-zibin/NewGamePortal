import * as React from 'react';
import { Contact, RouterMatchParams } from '../types';
import { MatchInfo } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import { ourFirebase } from '../services/firebase';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { History } from 'history';
import { checkNotNull } from '../globals';

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
  userType: string;
}

interface DataSourceConfig {
  text: string;
  value: string;
}

// todo rename allusers to allUserNames, do not use any
interface Props {
  matchesList: MatchInfo[];
  users: ContactWithUserId[];
  notUsers: Contact[];
  allUserNames: UserName[];
  match: RouterMatchParams;
  myUserId: string;
  history: History;
}

class ContactsList extends React.Component<Props, {}> {
  state = {
    filterValue: '',
    userAdded: false
  };

  handleRequest = (chosenRequest: DataSourceConfig, index: number) => {
    if (chosenRequest.text.length > 0) {
      this.setState({ filterValue: chosenRequest.text });
    }
    console.log(chosenRequest.text);
    return index;
  };

  handleUpdate = (searchText: string, dataSource: any[]) => {
    if (searchText.length === 0) {
      this.setState({ filterValue: '' });
    }
    console.log(dataSource.length);
  };

  getMatch = () => {
    let currentMatchId: String = this.props.match.params.matchIdInRoute;
    let currentMatch = this.props.matchesList.find(
      match => match.matchId === currentMatchId
    );
    return checkNotNull(currentMatch)!;
  };

  handleAddUser = (userId: string) => {
    console.log('Adding participant userId=', userId);
    let currentMatch = this.getMatch();
    ourFirebase.addParticipant(currentMatch, userId);
    this.props.history.push('/matches/' + currentMatch.matchId);
  };

  handleAddNotUser = (contact: Contact) => {
    // todo: sent Sms
    console.log('Sending SMS to ', contact);
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

  // TODO: use primaryText & secondaryText in AutoComplete to show whether
  // the name is an existing user ("Existing user") or not a user ("Invite with SMS").
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
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
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
      // userName.name = contact.name;
      // userName.userType = "Existing user";
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
      // userName.name = contact.name;
      // userName.userType = "Invite with SMS";
      allUserNames.push(userName);
    }
  }

  users.sort((c1, c2) => c1.name.localeCompare(c2.name));
  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));
  return {
    users,
    notUsers,
    allUserNames,
    matchesList: state.matchesList,
    myUserId: state.myUser.myUserId
  };
};
export default connect(mapStateToProps)(ContactsList);
