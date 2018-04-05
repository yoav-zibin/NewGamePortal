import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
// import { ourFirebase } from '../services/firebase';

import { MatchInfo, UserIdToPhoneNumber, PhoneNumberToContact } from '../types';
// import { GridList, GridTile } from 'material-ui/GridList';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';

import { List, ListItem } from 'material-ui/List';
// import ActionGrade from 'material-ui/svg-icons/action/grade';
import Avatar from 'material-ui/Avatar';
import { Link } from 'react-router-dom';

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
    width: 60,
    bottom: '5px',
    top: '5px'
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
  userIdToPhoneNumber: UserIdToPhoneNumber;
  phoneNumberToContact: PhoneNumberToContact;
}

class MatchesList extends React.Component<Props, {}> {
  style = {
    textDecoration: 'None'
  }
  render() {
    return (
      <div>
        <AppBar
          title="Game Portal"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <div style={styles.root}>
          <List style={styles.list}>
            {this.props.matchesList.map((tile, index) => (
              <Link
                style={this.style}
                to={{
                  pathname: '/matches/' + tile.matchId,
                }}
              >
                <ListItem
                  // test implementation has the same match repeating,
                  // will cause warning with just tile.matchId
                  key={tile.matchId + index}
                  primaryText={tile.game.gameName}
                  secondaryText={
                    'Last played ' +
                    timeSince(tile.lastUpdatedOn) +
                    ' ago with ' +
                    // FIXME: The store doesn't have values for phoneNumberToContact and
                    // userIdToPhoneNumber, so it throws an undefined error.
                    tile.participantsUserIds.reduce(
                      (accum: string, userId: string) => {
                        const phone: string = this.props.userIdToPhoneNumber[
                          userId
                        ];
                        if (phone) {
                          const name: string = this.props.phoneNumberToContact[
                            phone
                          ].name;
                          return (accum += name + ' ');
                        } else {
                          return (accum += 'Unidentified User ');
                        }
                      },
                      ''
                    )
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
        <FloatingActionButton style={styles.button} href="/addMatch">
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
  matchesList: state.matchesList,
  userIdToPhoneNumber: state.userIdsAndPhoneNumbers.userIdToPhoneNumber,
  phoneNumberToContact: state.phoneNumberToContact
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(MatchesList);
