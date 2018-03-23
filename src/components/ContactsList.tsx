import * as React from 'react';
// import Contacts from './Contacts';
import SearchBar from './SearchBar';
// import {PhoneNumberToUserId, PhoneNumberToContact, Contact} from '../types';
import { Contact } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
// import TextField from 'material-ui/TextField';

const style = {
  marginRight: 20
};

/*interface Props {
  users: Contact[];
  notUsers: Contact[]
}*/

const testUsers: Contact[] = [
  {
    phoneNumber: '24324',
    name: 'Brendan Lim'
  },
  {
    phoneNumber: '235352',
    name: 'Eric Hoffman'
  },
  {
    phoneNumber: '1531235',
    name: 'Grace Ng'
  },
  {
    phoneNumber: '5123523',
    name: 'Chelsea Otakan'
  }
];
const testNotUsers: Contact[] = [
  {
    phoneNumber: '23415432',
    name: 'Kerem Suer'
  },
  {
    phoneNumber: '12341234',
    name: 'Raquel Parrado'
  },
  {
    phoneNumber: '41234123',
    name: 'James Anderson'
  }
];

class ContactsList extends React.Component<{}, {}> {
  constructor(props: any) {
    super(props);
    /*this.state = {
      users: [],
      notUsers: []
    };*/
    //  this.setState({users: testUsers, notUsers: testNotUsers});
  }
  render() {
    return (
      <div>
        <SearchBar />

        <List>
          <Subheader>Game User</Subheader>
          {testUsers.map((user: Contact) => (
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
          {testNotUsers.map((user: Contact) => (
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
