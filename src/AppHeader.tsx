import * as React from 'react';
import AppBar from 'material-ui/AppBar';

class AppHeader extends React.Component {
  render() {
    return (
      <AppBar
        title="Game Portal"
        iconClassNameRight="muidocs-icon-navigation-expand-more"
      />
    );
  }
}

export default AppHeader;
