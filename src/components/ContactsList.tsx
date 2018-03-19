import * as React from 'react';
import Contacts from './Contacts';
import SearchBar from './SearchBar';
// import TextField from 'material-ui/TextField';

class ContactsList extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <SearchBar />
        <Contacts />
      </div>
    );
  }
}
export default ContactsList;
