import * as React from 'react';
import { GridList, GridTile } from 'material-ui/GridList';
import { GameInfo, CSSPropertiesIndexer } from '../types';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const styles: CSSPropertiesIndexer = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  gridList: {
    // position: 'absolute',
    left: 0,
    right: 0
    // overflowY: 'auto'
  },
  gridTile: {
    height: '100%',
    width: '100%'
  }
};

interface Props {
  gamesList: GameInfo[];
  createMatch: (game: GameInfo) => void;
}

class GamesList extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        {
          <div style={styles.root}>
            <GridList cellHeight={100} style={styles.gridList}>
              {this.props.gamesList.map((gameInfo: GameInfo) => (
                <div
                  style={styles.gridTile}
                  key={gameInfo.gameSpecId}
                  onClick={() => this.props.createMatch(gameInfo)}
                >
                  <GridTile title={gameInfo.gameName} subtitle={''}>
                    <img src={gameInfo.screenShot.downloadURL} />
                  </GridTile>
                </div>
              ))}
            </GridList>
          </div>
        }
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});
export default connect(mapStateToProps)(GamesList);
