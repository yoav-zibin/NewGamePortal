import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import Board from '../components/Board';

const mapStateToProps = (state: StoreState) => ({
  boardImage: state.games.current.info.boardImage,
  pieces: state.games.current.info.pieces
});

const mapDispatchToProps = (dispatch: any) => ({
});

const BoardGameContainer = connect(
  mapStateToProps,
  mapDispatchToProps)(Board);

// Redux wrapper for board for game being played in gameportal.
// TODO: Use BoardGameContainer at place where the game needs to be displayed
export default BoardGameContainer;
