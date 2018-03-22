import * as React from 'react';
import '../App.css';

import GamesList from '../components/GamesList';

import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import AutoComplete from 'material-ui/AutoComplete';
import { GameInfo } from '../types';

const style: any = {
  display: 'block',
  margin: '0 auto'
};
const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

const GamesListContainer = connect(mapStateToProps, mapDispatchToProps)(
  GamesList
);

interface Props {
  gamesList: GameInfo[];
}

class AddMatches extends React.Component<Props, {}> {
  // Invoked when a list item is selected
  onNewRequest = () => {
    // TODO: Link to the new match setup (adding contacts, etc...)
  };

  render() {
    return (
      <div>
        <AutoComplete
          floatingLabelText="Game Name"
          filter={AutoComplete.caseInsensitiveFilter}
          dataSource={this.props.gamesList}
          style={style}
          onNewRequest={this.onNewRequest}
        />
        <GamesListContainer />
      </div>
    );
  }
}

export default AddMatches;
