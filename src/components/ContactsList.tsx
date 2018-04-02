import * as React from 'react';
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

// interface Props
interface ContactWithUserId extends Contact {
  userId: string;
}

interface Props {
  users: ContactWithUserId[];
  notUsers: Contact[];
  allUsers: String[];
}

class ContactsList extends React.Component<Props, {}> {
  state = {
    filterValue: ''
  };

  handleRequest = (chosenRequest: string, index: number) => {
    if (chosenRequest.length > 0) {
      this.setState({ filterValue: chosenRequest });
    }
    console.log(chosenRequest.length);
    return index;
  };

  handleUpdate = (searchText: string, dataSource: any[]) => {
    if (searchText.length === 0) {
      this.setState({ filterValue: '' });
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
          dataSource={this.props.allUsers}
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
  const allUsers: String[] = [];
  const phoneNumbers = Object.keys(state.phoneNumberToContact);
  for (let phoneNumber of phoneNumbers) {
    const contact = state.phoneNumberToContact[phoneNumber];
    const userId =
      state.userIdsAndPhoneNumbers.phoneNumberToUserId[phoneNumber];
    if (userId) {
      users.push({ ...contact, userId: userId });
      allUsers.push(contact.name);
    } else {
      notUsers.push(contact);
      allUsers.push(contact.name);
    }
  }

  users.sort((c1, c2) => c1.name.localeCompare(c2.name));
  notUsers.sort((c1, c2) => c1.name.localeCompare(c2.name));
  return {
    users,
    notUsers,
    allUsers
  };
};
// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ContactsList);
