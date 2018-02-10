import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import AppBar from 'material-ui/AppBar';

class MyGames extends React.Component {
  render() {
    return (
      <div>
        <AppBar
          title="Game Portal"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <RaisedButton label="Default" />
      </div>
    );
  }
}

export default MyGames;
