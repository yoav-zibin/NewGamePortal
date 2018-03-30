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

// interface Props

class ContactsList extends React.Component<{}, {}> {
  state = {
    users: testUsers,
    notUsers: testNotUsers,
    value: ''
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
          {this.state.users.map((user: Contact) => (
            <ListItem
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
          {this.state.notUsers.map((user: Contact) => (
            <ListItem
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

export default ContactsList;
