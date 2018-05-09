import * as React from 'react';
import { connect } from 'react-redux';
import { StoreState, CSSPropertiesIndexer } from '../types/index';
import { MatchInfo, UserIdToInfo } from '../types';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { List, ListItem } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import { Link } from 'react-router-dom';
import { getOpponents } from '../globals';

const styles: CSSPropertiesIndexer = {
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
    width: 60,
    bottom: '5px',
    top: '5px'
  },
  button: {
    flex: 1,
    position: 'fixed',
    bottom: 15,
    right: 15,
    alignSelf: 'flex-end'
    // float: 'right'
  }
};

interface Props {
  matchesList: MatchInfo[];
  myUserId: string;
  userIdToInfo: UserIdToInfo;
}

class MatchesList extends React.Component<Props, {}> {
  style: React.CSSProperties = {
    textDecoration: 'None'
  };

  getOpponentNames = (participantsUserIds: string[]) => {
    if (participantsUserIds.length === 1) {
      return '';
    }
    return (
      ' with ' +
      getOpponents(
        participantsUserIds,
        this.props.myUserId,
        this.props.userIdToInfo
      )
        .map(opponent => opponent.name)
        .join(', ')
    );
  };

  render() {
    return (
      <div>
        <div style={styles.root}>
          <List style={styles.list}>
            {this.props.matchesList.map(tile => (
              <Link
                key={tile.matchId}
                style={this.style}
                to={{
                  pathname: '/matches/' + tile.matchId
                }}
              >
                <ListItem
                  // test implementation has the same match repeating,
                  // will cause warning with just tile.matchId
                  primaryText={tile.game.gameName}
                  secondaryText={
                    'Last played ' +
                    timeSince(tile.lastUpdatedOn) +
                    ' ago' +
                    this.getOpponentNames(tile.participantsUserIds)
                  }
                  rightAvatar={
                    <Avatar
                      src={tile.game.screenShot.downloadURL}
                      style={styles.icon}
                    />
                  }
                />
              </Link>
            ))}
          </List>
        </div>
        <Link
          style={styles.button}
          to={{
            pathname: '/addMatch'
          }}
        >
          <FloatingActionButton>
            <ContentAdd />
          </FloatingActionButton>
        </Link>
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
  matchesList: state.matchesList,
  userIdToInfo: state.userIdToInfo,
  myUserId: state.myUser.myUserId
});
export default connect(mapStateToProps)(MatchesList);
