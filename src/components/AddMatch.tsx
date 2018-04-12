import * as React from 'react';
import '../App.css';
import AutoComplete from 'material-ui/AutoComplete';
import { GameInfo } from '../types';
import GamesList from './GamesList';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { ourFirebase } from '../services/firebase';
import { History } from 'history';

const style: React.CSSProperties = {
  display: 'block',
  margin: '0 auto'
};

interface Props {
  gamesList: GameInfo[];
  history: History;
}

class AddMatches extends React.Component<Props, {}> {
  // Invoked when a list item is selected
  onNewRequest = (chosenGame: string, index: number) => {
    console.log('CHOSEN GAME:', chosenGame, index);
    this.props.gamesList.forEach((game: GameInfo) => {
      if (game.gameName === chosenGame) {
        this.createMatch(game);
      }
    });
  };

  createMatch = (game: GameInfo) => {
    let matchId = ourFirebase.createMatch(game).matchId;
    console.log('createMatch matchId=', matchId);
    this.props.history.push('/matches/' + matchId);
  };

  render() {
    console.log('window addMatch' + window.innerHeight + window.innerWidth);
    console.log('this.props.gamesList=', this.props.gamesList);
    return (
      <div>
        <AutoComplete
          floatingLabelText="Game Name"
          filter={AutoComplete.caseInsensitiveFilter}
          dataSource={this.props.gamesList.map(g => g.gameName)}
          style={style}
          onNewRequest={this.onNewRequest}
          fullWidth={true}
        />
        <GamesList createMatch={g => this.createMatch(g)} />
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});
export default connect(mapStateToProps)(AddMatches);
