import * as React from 'react';
import '../App.css';
import AutoComplete from 'material-ui/AutoComplete';
import { GameInfo } from '../types';
import GamesList from './GamesList';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const style: any = {
  display: 'block',
  margin: '0 auto'
};

interface Props {
  gamesList: GameInfo[];
}

class AddMatches extends React.Component<Props, {}> {
  // Invoked when a list item is selected
  onNewRequest = () => {
    // TODO: Link to the new match setup (adding contacts, etc...)
    // Create the match via firebase
    // Use router to go to /matches/:matchId
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
        <GamesList />
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
