import * as React from 'react';
// import {PhoneNumberToUserId, PhoneNumberToContact, Contact} from '../types';
import { Contact } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import AutoComplete from 'material-ui/AutoComplete';

const style = {
  marginRight: 20
};

const testUsers: Contact[] = [
  {
    phoneNumber: '9175730795',
    name: 'Brendan Lim'
  },
  {
    phoneNumber: '2016824408',
    name: 'Eric Hoffman'
  },
  {
    phoneNumber: '7326476905',
    name: 'Grace Ng'
  },
  {
    phoneNumber: '7187107933',
    name: 'Chelsea Otakan'
  }
];
const testNotUsers: Contact[] = [
  {
    phoneNumber: '7185525029',
    name: 'Kerem Suer'
  },
  {
    phoneNumber: '2038859211',
    name: 'Raquel Parrado'
  },
  {
    phoneNumber: '5513586613',
    name: 'James Anderson'
  }
];

const allUsers: String[] = [
  'Brendan Lim',
  'Eric Hoffman',
  'Grace Ng',
  'Chelsea Otakan',
  'Kerem Suer',
  'Raquel Parrado',
  'James Anderson'
];

interface ContactWithUserId extends Contact {
  userId: string;
}

interface Props {
  users: ContactWithUserId[];
  notUsers: Contact[];
}

class ContactsList extends React.Component<Props, {}> {
  state = {
    filterValue: ''
  };

  handleRequest = (chosenRequest: string, index: number) => {
    if (chosenRequest.length > 0) {
      let targetUser: Contact[] = [];
      let targetNotUser: Contact[] = [];
      let flag: number = 0;

      testUsers.map((user: Contact) => {
        if (user.name === chosenRequest) {
          targetUser.push(user);
          flag = 1;
        }
      });

      if (flag !== 1) {
        testNotUsers.map((user: Contact) => {
          if (user.name === chosenRequest) {
            targetNotUser.push(user);
          }
        });
      }
      this.setState({ users: targetUser, notUsers: targetNotUser });
    } else {
      this.setState({ users: testUsers, notUsers: testNotUsers });
    }
    console.log(chosenRequest.length);
    return index;
  };

  handleUpdate = (searchText: string, dataSource: any[]) => {
    if (searchText.length === 0) {
      this.setState({ users: testUsers, notUsers: testNotUsers });
    }
    console.log(dataSource.length);
  };

  filterContacts(contacts: Contact[]) {
    return contacts.filter(
      contact => contact.name.indexOf(this.state.filterValue) !== -1
    );
  }

  render() {
    return (
      <div>
        <br />
        <AutoComplete
          floatingLabelText="Search"
          filter={AutoComplete.fuzzyFilter}
          dataSource={allUsers}
          maxSearchResults={5}
          onNewRequest={this.handleRequest}
          onUpdateInput={this.handleUpdate}
        />
        <List>
          <Subheader>Game User</Subheader>
          {this.filterContacts(this.props.users).map((user: Contact) => (
            <ListItem
              key={user.phoneNumber}
              primaryText={user.name}
              rightIconButton={
                <FloatingActionButton mini={true} style={style}>
                  <ContentAdd />
                </FloatingActionButton>
              }
            />
          ))}
        </List>
        <Divider />
        <List>
          <Subheader>Not Game User</Subheader>
          {this.filterContacts(this.props.notUsers).map((user: Contact) => (
            <ListItem
              key={user.phoneNumber}
              primaryText={user.name}
              rightIconButton={
                <RaisedButton label="invite" primary={true} style={style} />
              }
            />
          ))}
        </List>
      </div>
    );
  }
}

import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => {
  const users: ContactWithUserId[] = [];
  const notUsers: Contact[] = [];
  const phoneNumbers = Object.keys(state.phoneNumberToContact);
  for (let phoneNumber of phoneNumbers) {
    const contact = state.phoneNumberToContact[phoneNumber];
    const userId =
      state.userIdsAndPhoneNumbers.phoneNumberToUserId[phoneNumber];
    if (userId === state.myUser.myUserId) {
      // Ignore my user (in case I have my own phone number in my contacts)
    } else if (userId) {
      users.push({ ...contact, userId: userId });
    } else {
      notUsers.push(contact);
    }
  }
  users.sort((c1, c2) => c1.name.localeCompare(c2.name));
  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));
  return {
    users,
    notUsers
  };
};
// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ContactsList);
