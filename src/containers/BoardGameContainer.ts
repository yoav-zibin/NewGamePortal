import { connect, Dispatch } from 'react-redux';
import { StoreState } from '../types/index';
import Board from '../components/Board';
import { Action } from '../reducers';

const mapStateToProps = (state: StoreState) => ({
  pieces:
    state.gameSpecs.gameSpecIdToGameSpec[
      state.matchesList[state.currentMatchIndex].game.gameSpecId
    ].pieces,
  matchInfo: state.matchesList[state.currentMatchIndex],
  gameSpec:
    state.gameSpecs.gameSpecIdToGameSpec[
      state.matchesList[state.currentMatchIndex].game.gameSpecId
    ],
  myUserId: state.myUser.myUserId
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  onReset: () => {
    const action: Action = {
      resetMatch: null
    };
    dispatch({ type: action });
  }
});

const BoardGameContainer = connect(mapStateToProps, mapDispatchToProps)(Board);

// Redux wrapper for board for game being played in gameportal.
// TODO: Use BoardGameContainer at place where the game needs to be displayed
export default BoardGameContainer;
