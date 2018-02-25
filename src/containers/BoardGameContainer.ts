import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import Board from '../components/Board';

const mapStateToProps = (state: StoreState) => ({
  pieces: state.gameSpecs.gameSpecIdToGameSpec[state.matchesList[state.currentMatchIndex].game.gameSpecId].pieces
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({
});

const BoardGameContainer = connect(
  mapStateToProps,
  mapDispatchToProps)(Board);

// Redux wrapper for board for game being played in gameportal.
// TODO: Use BoardGameContainer at place where the game needs to be displayed
export default BoardGameContainer;
