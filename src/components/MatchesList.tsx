import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

import { MatchInfo } from '../types';
// import { GridList, GridTile } from 'material-ui/GridList';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';

import { List, ListItem } from 'material-ui/List';
// import ActionGrade from 'material-ui/svg-icons/action/grade';
import Avatar from 'material-ui/Avatar';

const styles: any = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  list: {
    width: '100%'
  },
  icon: {
    height: 60,
    width: 60
  },
  button: {
    flex: 1,
    position: 'fixed',
    bottom: 10,
    right: 0,
    alignSelf: 'flex-end'
    // float: 'right'
  }
};

interface Props {
  matchesList: MatchInfo[];
}

class MatchesList extends React.Component<Props, {}> {
  render() {
    let dates = this.props.matchesList.map(tile => {
      return timeSince(tile.lastUpdatedOn);
    });

    return (
      <div>
        <AppBar
          title="Game Portal"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <div style={styles.root}>
          <List style={styles.list}>
            {this.props.matchesList.map((tile, idx) => (
              <ListItem
                primaryText={tile.game.gameName}
                secondaryText={
                  'Last played ' +
                  dates[idx] +
                  ' ago with ' +
                  tile.participantsUserIds
                }
                rightAvatar={
                  <Avatar
                    src={tile.game.screenShot.downloadURL}
                    style={styles.icon}
                  />
                }
              />
            ))}
          </List>
        </div>
        <FloatingActionButton style={styles.button} href="/addMatches">
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}
function timeSince(date: number) {
  var seconds: number = Math.floor((+new Date() - date) / 1000);

  var interval: number = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + ' years';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
}

const mapStateToProps = (state: StoreState) => ({
  matchesList: state.matchesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(MatchesList);
