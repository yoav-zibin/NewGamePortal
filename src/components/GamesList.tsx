import * as React from 'react';
import Subheader from 'material-ui/Subheader';
import { GridList, GridTile } from 'material-ui/GridList';
import { GameInfo } from '../types';
import { ourFirebase } from '../services/firebase';
import { Link } from 'react-router-dom';

const styles: any = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  gridList: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflowY: 'auto'
  }
};

interface Props {
  gamesList: GameInfo[];
}

/**
 * TODOS:
 * 5. onClick of any of the grid tile dispatch an action which changes the currently selected game
 * and reroutes to that game's route.
 */
class GamesList extends React.Component<Props, {}> {
  onClick = (chosenGameName: string) => {

    for(let i = 0; i < this.props.gamesList.length; i++){
      let game: GameInfo = this.props.gamesList[i];

      if (game.gameName === chosenGameName) {
        let matchId = ourFirebase.createMatch(game).matchId;
        console.log("MATCH ID: ", matchId);
        return '/matches/' + matchId;
      }
    } // for loop
    return '/addMatch';
  };

  render() {
    return (
      <div>
        {
          <div style={styles.root}>
            <GridList cellHeight={180} style={styles.gridList}>
              <Subheader>Card games</Subheader>
              {this.props.gamesList.map((gameInfo: GameInfo) => (
                <Link
                  key={gameInfo.gameSpecId}
                  to={{
                    pathname: this.onClick(gameInfo.gameName)
                  }}
                >
                  <GridTile
                    title={gameInfo.gameName}
                    subtitle={''}
                  >
                    <img src={gameInfo.screenShot.downloadURL} />
                  </GridTile>
                </Link>
              ))}
            </GridList>
          </div>
        }
      </div>
    );
  }
}

import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});
// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GamesList);
