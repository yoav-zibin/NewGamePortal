import * as React from 'react';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';

const style = {
  marginRight: 20
};

const Contacts = () => {
  return (
    <div>
      <List>
        <Subheader>Game User</Subheader>
        <ListItem
          primaryText="Brendan Lim"
          rightIconButton={
            <FloatingActionButton mini={true} style={style}>
              <ContentAdd />
            </FloatingActionButton>
          }
        />
        <ListItem
          primaryText="Eric Hoffman"
          rightIconButton={
            <FloatingActionButton mini={true} style={style}>
              <ContentAdd />
            </FloatingActionButton>
          }
        />
        <ListItem
          primaryText="Grace Ng"
          rightIconButton={
            <FloatingActionButton mini={true} style={style}>
              <ContentAdd />
            </FloatingActionButton>
          }
        />
        <ListItem
          primaryText="Kerem Suer"
          rightIconButton={
            <FloatingActionButton mini={true} style={style}>
              <ContentAdd />
            </FloatingActionButton>
          }
        />
        <ListItem
          primaryText="Raquel Parrado"
          rightIconButton={
            <FloatingActionButton mini={true} style={style}>
              <ContentAdd />
            </FloatingActionButton>
          }
        />
      </List>
      <Divider />
      <List>
        <Subheader>Not Game User</Subheader>
        <ListItem
          primaryText="Chelsea Otakan"
          rightIconButton={
            <RaisedButton label="invite" primary={true} style={style} />
          }
        />
        <ListItem
          primaryText="James Anderson"
          rightIconButton={
            <RaisedButton label="invite" primary={true} style={style} />
          }
        />
      </List>
    </div>
  );
};

export default Contacts;
