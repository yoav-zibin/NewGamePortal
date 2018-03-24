import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import AppBar from 'material-ui/AppBar';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

import { MatchInfo } from '../types';
import { GridList, GridTile } from 'material-ui/GridList';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';

const styles: any = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  gridList: {
    width: 500,
    height: 450,
    overflowY: 'auto'
  },
  button: {
    float: 'right',
    marginRight: 500,
    marginTop: 70
  }
};

interface Props {
  matchesList: MatchInfo[];
}

class MatchesList extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        <AppBar
          title="Game Portal"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <RaisedButton label="Default" />
        <div style={styles.root}>
          <GridList cellHeight={180} style={styles.gridList}>
            <Subheader>December</Subheader>
            {this.props.matchesList.map(tile => (
              <GridTile
                key={tile.game.gameSpecId}
                title={tile.game.gameName}
                subtitle={''}
                actionIcon={
                  <IconButton>
                    <StarBorder color="white" />
                  </IconButton>
                }
              >
                <img src={tile.game.screenShot.downloadURL} />
              </GridTile>
            ))}
          </GridList>
        </div>
        <FloatingActionButton style={styles.button} href="/addMatches">
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  matchesList: state.matchesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(MatchesList);
