import * as React from 'react';
import '../App.css';
import AutoComplete from 'material-ui/AutoComplete';
import { GameInfo } from '../types';
import GamesList from './GamesList';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import { ourFirebase } from '../services/firebase';
import { History } from 'history';

const style: any = {
  display: 'block',
  margin: '0 auto'
};

interface Props {
  history: History;
  gamesList: GameInfo[];
}

class AddMatches extends React.Component<Props, {}> {
  // Invoked when a list item is selected
  onNewRequest = (chosenGame: string, index: number) => {
    console.log('CHOSEN GAME:', chosenGame, index);
    this.props.gamesList.forEach((game: GameInfo) => {
      if (game.gameName === chosenGame) {
        let matchId = ourFirebase.createMatch(game).matchId;
        let url = '/matches/' + matchId;
        if (this.props.history.location.search) {
          url += this.props.history.location.search;
        }
        window.location.href = url;
      }
    });
  };

  render() {
    console.log('this.props.gamesList=', this.props.gamesList);
    return (
      <div>
        <AutoComplete
          floatingLabelText="Game Name"
          filter={AutoComplete.caseInsensitiveFilter}
          dataSource={this.props.gamesList.map(g => g.gameName)}
          style={style}
          onNewRequest={this.onNewRequest}
        />
        <GamesList history={this.props.history} />
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(AddMatches);
