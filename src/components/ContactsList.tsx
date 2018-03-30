import * as React from 'react';
// import Contacts from './Contacts';
// import SearchBar from './SearchBar';
// import {PhoneNumberToUserId, PhoneNumberToContact, Contact} from '../types';
import { Contact } from '../types';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import TextField from 'material-ui/TextField';
// import TextField from 'material-ui/TextField';

const style = {
  marginRight: 20
};

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

  handleChange = (event: any) => {
    this.setState({
      filterValue: event.target.value
    });
  };

  filterContacts(contacts: Contact[]) {
    return contacts.filter(
        contact => contact.name.indexOf(this.state.filterValue) !== -1);
  }

  render() {
    return (
      <div>
        <TextField
          hintText="Search"
          fullWidth={true}
          onChange={this.handleChange}
        />
        <List>
          <Subheader>Game User</Subheader>
          {this.filterContacts(this.props.users)
            .map((user: Contact) => (
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
          {this.filterContacts(this.props.notUsers)
            .map((user: Contact) => (
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

import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => {
  const users: ContactWithUserId[] = [];
  const notUsers: Contact[] = [];
  const phoneNumbers = Object.keys(state.phoneNumberToContact);
  for (let phoneNumber of phoneNumbers) {
    const contact = state.phoneNumberToContact[phoneNumber];
    const userId = state.userIdsAndPhoneNumbers.phoneNumberToUserId[phoneNumber];
    if (userId) {
      users.push({...contact, userId: userId});
    } else {
      notUsers.push(contact);
    }
  }
  users.sort((c1, c2) => c1.name.localeCompare(c2.name));
  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));
  return {
    users, notUsers
  };
};
// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ContactsList);
